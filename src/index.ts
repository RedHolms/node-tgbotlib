import { CanceledError } from "axios";
import { TelegramAPI } from "./api";
import { assumeIs } from "./assume";
import { EventEmitter } from "./emitter";
import { InlineKeyboardButtonActionType, KeyboardType } from "./keyboard";
import { parseRawMessage } from "./message";
import { User } from "./user";
import { parseRawChat } from ".";
import type { InlineCallback, InlineKeyboard, Keyboard } from "./keyboard";
import type { Message } from "./message";
import type TG from "./tg";

export type CommandCallback = (message: Message) => void | Promise<void>;
type UpdateHandler<T> = (update: NonNullable<T>) => Promise<any>;

export * from "./chat";
export * from "./message";
export * from "./keyboard";

interface UpdatesHandlersMap {
  set<K extends TG.UpdateTypes>(key: K, handler: UpdateHandler<TG.Update[K]>): void;
  has<K extends TG.UpdateTypes>(key: K): boolean;
  get<K extends TG.UpdateTypes>(key: K): UpdateHandler<TG.Update[K]> | undefined;
}

export interface BotBaseEvents {
  start:    [];
  shutdown: [];
  message:  [message: Message];
}

export interface LoggerLike {
  debug(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
  warn(message: any, ...args: any[]): void;
  error(message: any, ...args: any[]): void;
  fatal(message: any, ...args: any[]): void;
}

export abstract class BotBase extends EventEmitter<BotBaseEvents> {
  api: TelegramAPI;
  private abortController?: AbortController;
  private handlers: UpdatesHandlersMap;
  // <chatid>_<messageid> -> weak ref to object
  private messages: Map<string, WeakRef<Message>>;
  private commands: Map<string, CommandCallback>;
  // todo weak refs everywhere
  private inlineCalbacks: Map<string, InlineCallback>;
  private inlineCalbacksKeys: Map<InlineCallback, string>;

  declare protected botInfo: {
    id: number;
    firstName: string;
    username: string;
    canJoinGroups: boolean;
    canReadAllGroupMessages: boolean;
    supportsInlineQueries: boolean;
    canConnectToBusinnes: boolean;
    hasMainWebApp: boolean;
  };

  constructor() {
    super();
    this.api = new TelegramAPI();
    this.handlers = new Map();
    this.messages = new Map();
    this.commands = new Map();
    this.inlineCalbacks = new Map();
    this.inlineCalbacksKeys = new Map();
  }

  declare protected log: LoggerLike;
  getLogger(): LoggerLike {
    const stub = () => {};
    return { debug: stub, info: stub, warn: stub, error: stub, fatal: stub };
  }

  abstract init(): void | Promise<void>;

  private async processUpdates(update: TG.Update) {
    await Promise.all((Object.keys(update) as (keyof TG.Update)[]).map((key) => {
      if (key === "update_id")
        return Promise.resolve();

      const handler = this.handlers.get(key);

      if (!handler) {
        this.log.warn(`Unknown update type "${key}"`);
        return Promise.resolve();
      }

      return handler(update[key]!);
    }));
  }

  private async handleNewMessage(raw: TG.Message) {
    const key = `${raw.chat.id}_${raw.message_id}`;
    const message = parseRawMessage(raw, this);
    this.messages.set(key, new WeakRef(message));

    const promises: Promise<void>[] = [];

    promises.push(this.safeEmit("message", message as any));

    if (raw.entities) {
      // Here we're sure that text must be a string
      const text = raw.text!;

      for (const entity of raw.entities) {
        if (entity.type === "bot_command") {
          let command = text.slice(entity.offset + 1, entity.offset + entity.length);

          let index;
          if ((index = command.search('@')) != -1) {
            // command in chat
            command = command.slice(0, index);
          }

          const callback = this.commands.get(command);
          if (callback)
            promises.push((callback as any)(message));
        }
      }
    }

    await Promise.all(promises);
  }

  private async handleCallbackQuery(raw: TG.CallbackQuery) {
    if (!raw.data) {
      this.log.warn("Callback query without a data: ", raw);
      return;
    }

    if (raw.data.startsWith("0;")) {
      // inline button callback
      const key = raw.data.slice(2);
      const callback = this.inlineCalbacks.get(key);

      if (!callback) {
        this.log.warn("Invalid inline button callback key: ", key);
        return;
      }

      let result = await callback(new User(raw.from, this), raw.message && parseRawChat(raw.message.chat, this));
      if (typeof result === "string")
        result = { text: result };

      await this.api.call("answerCallbackQuery", {
        callback_query_id: raw.id,
        text: result?.text,
        show_alert: result?.alert
      });
    }
  }

  private generateUniqueKey(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-0123456789";
    const charactersLength = characters.length;
  
    let result = "";
    let counter = 0;
  
    while (counter < 62) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      ++counter;
    }
  
    return result;
  }

  private hashInlineCallback(callback: InlineCallback): string {
    if (this.inlineCalbacksKeys.has(callback))
      return this.inlineCalbacksKeys.get(callback)!;

    let key;
    do {
      key = this.generateUniqueKey();
    }
    while (this.inlineCalbacks.has(key));

    this.inlineCalbacks.set(key, callback);
    this.inlineCalbacksKeys.set(callback, key);

    return key;
  }

  /** @internal */
  processKeyboard(keyboard: Keyboard): TG.InlineKeyboardMarkup | TG.ReplyKeyboardMarkup {
    switch (keyboard.type) {
      case KeyboardType.NORMAL:
        throw new Error("TODO");
      case KeyboardType.INLINE: {
        assumeIs<InlineKeyboard>(keyboard);
        const buttons: TG.InlineKeyboardButton[][] = [];

        for (const row of keyboard.buttons) {
          const rawRow: TG.InlineKeyboardButton[] = [];
          for (const button of row) {
            const action = button.action;
            
            const rawButton: TG.InlineKeyboardButton = {
              text: button.text
            };

            switch (action.type) {
              case InlineKeyboardButtonActionType.URL:
                rawButton.url = action.url;
                break;
              case InlineKeyboardButtonActionType.COPY_TEXT:
                rawButton.url = action.text;
                break;
              case InlineKeyboardButtonActionType.CALLBACK: {
                const { callback } = action;
                const key = this.hashInlineCallback(callback);

                rawButton.callback_data = `0;${key}`;
              } break;
            }

            rawRow.push(rawButton);
          }

          buttons.push(rawRow);
        }

        return {
          inline_keyboard: buttons
        };
      }
      default:
        throw new Error("invalid keyboard type");
    }
  }

  protected registerCommand(command: string, callback: CommandCallback): void {
    this.commands.set(command, callback);
  }

  protected unregisterCommand(command: string): void {
    this.commands.delete(command);
  }

  async start() {
    if (!process.env.BOT_TOKEN)
      throw new Error("You need to set BOT_TOKEN env variable");

    this.api.setToken(process.env.BOT_TOKEN);

    await this.updateBotInfo();
    this.log = this.getLogger();

    await this.init();

    this.handlers.set("message", this.handleNewMessage.bind(this));
    this.handlers.set("callback_query", this.handleCallbackQuery.bind(this));
    
    this.abortController = new AbortController();
    let updateOffset: number | undefined = undefined;

    const cleanerInterval = setInterval(() => {
      for (const k of this.messages.keys()) {
        if (this.messages.get(k)!.deref() === undefined) {
          this.log.debug("Message %s destroyed by GC", k);
          this.messages.delete(k);
        }
      }
    }, 5000);
    
    try {
      await this.safeEmit("start");

      while (!this.abortController.signal.aborted) {
        const updates = await this.api.callEx("getUpdates", {
          args: {
            offset: updateOffset,
            timeout: 40
          },
          abortController: this.abortController
        });

        const promises: Promise<void>[] = [];
        for (const update of updates) {
          if (!updateOffset || update.update_id >= updateOffset)
            updateOffset = update.update_id + 1;

          promises.push(this.processUpdates(update));
        }

        await Promise.all(promises);
      }
    }
    catch(error) {
      if (!(error instanceof CanceledError))
        throw error;
    }
    finally {
      clearInterval(cleanerInterval);
    }
  }

  private async safeEmit<K extends keyof BotBaseEvents>(event: K, ...args: BotBaseEvents[K]): Promise<void> {
    try {
      await this.emit(event, ...args);
    }
    catch(error: any) {
      this.log.error(`Error in event ${event}`);
      this.log.error(error);
    }
  }

  protected async updateBotInfo() {
    const me = await this.api.call("getMe");
    
    this.botInfo = {
      id: me.id,
      firstName: me.first_name,
      username: me.username!, // Bots always have a name
      canJoinGroups: me.can_join_groups,
      canReadAllGroupMessages: me.can_read_all_group_messages,
      supportsInlineQueries: me.supports_inline_queries,
      canConnectToBusinnes: me.can_connect_to_business,
      hasMainWebApp: me.has_main_web_app
    };
  }
};
