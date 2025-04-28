import { CanceledError } from "axios";
import log4js from "log4js";
import { TelegramAPI } from "./api";
import { assumeIs } from "./assume";
import { ChatsStorage  } from "./chat";
import { EventEmitter } from "./emitter";
import { InlineKeyboardButtonActionType, KeyboardType } from "./keyboard";
import { MessagesStorage } from "./message";
import { Photo } from "./photo";
import { UsersStorage } from "./user";
import { sleep } from "./utils";
import type { Chat } from "./chat";
import type { InlineCallback, InlineKeyboard, Keyboard } from "./keyboard";
import type { Message, MessageInit, ObjectMessageInit } from "./message";
import type TG from "./tg";
import type { Logger } from "log4js";

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

export interface GarbageStatistics {
  memoryUsage: NodeJS.MemoryUsage;
  messagesCount: number;
  usersCount: number;
  chatsCount: number;
}

export interface GarbageCollectionStatistics {
  before: GarbageStatistics;
  after: GarbageStatistics;
}

export abstract class BotBase extends EventEmitter<BotBaseEvents> {
  api: TelegramAPI;
  log: Logger;
  private abortController?: AbortController;
  private handlers: UpdatesHandlersMap;
  private commands: Map<string, CommandCallback>;
  // todo weak refs everywhere
  private inlineCalbacks: Map<string, InlineCallback>;
  private inlineCalbacksKeys: Map<InlineCallback, string>;

  /** @internal */
  messages: MessagesStorage;
  /** @internal */
  users: UsersStorage;
  /** @internal */
  chats: ChatsStorage;

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
    super(void 0 as any);
    this.__setBot(this);

    log4js.configure({
      appenders: {
        console: {
          type: "stdout",
          layout: {
            type: "pattern",
            pattern: "\x1B[90m%d{dd/MM/yyyy hh:mm:ss.SSS}\x1B[39m %[%-5p%] %m"
          }
        }
      },
      categories: {
        default: {
          appenders: [ "console" ],
          level: "trace"
        }
      }
    });
    this.log = log4js.getLogger();

    this.api = new TelegramAPI(this);
    this.handlers = new Map();
    this.commands = new Map();
    this.inlineCalbacks = new Map();
    this.inlineCalbacksKeys = new Map();

    this.messages = new MessagesStorage(this);
    this.users = new UsersStorage(this);
    this.chats = new ChatsStorage(this);
  }

  abstract init(): void | Promise<void>;

  public getGarbageStatistics(): GarbageStatistics {
    return {
      memoryUsage: process.memoryUsage(),
      messagesCount: this.messages.objectsCount,
      usersCount: this.users.objectsCount,
      chatsCount: this.chats.objectsCount
    };
  }

  public async collectGarbage(): Promise<GarbageCollectionStatistics | undefined> {
    if (!gc) {
      this.log.warn("Calling collectGarbage(), but gc is not available! Pass --expose-gc to our node js arguments");
      return undefined;
    }

    const before = this.getGarbageStatistics();
    await gc({
      execution: "async"
    });

    await sleep(5);

    const after = this.getGarbageStatistics();

    return { before, after };
  }

  private processUpdates(update: TG.Update) {
    const keys = Object.keys(update) as (keyof TG.Update)[];
    keys.map((key) => {
      if (key === "update_id")
        return;

      const handler = this.handlers.get(key);

      if (!handler) {
        this.log.warn(`Unknown update type "${key}"`);
        return;
      }

      handler(update[key]!);
    });
  }

  private async handleNewMessage(raw: TG.Message) {
    const message = this.messages.receive(raw);

    if (message.chat.safeEmit("message", message)[0] == 0) {
      this.safeEmit("message", message);
    }

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
            callback(message);
        }
      }
    }
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

      let result = await callback(
        this.users.receive(raw.from),
        raw.message && this.chats.receive(raw.message.chat)
      );
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

  async sendMessage(chatId: number | `@${string}`, init: MessageInit): Promise<Message> {
    if (typeof init === "string")
      init = { text: init };
    else if (init instanceof Photo)
      init = { photo: init as Photo };

    assumeIs<ObjectMessageInit>(init);

    let replyParameters: TG.ReplyParameters | undefined;

    if (init.replyTo) {
      let message = init.replyTo;
      if (typeof message === "number")
        message = { id: message, chat: { id: chatId } as Chat } as Message;

      replyParameters = {
        message_id: message.id
      };

      if (chatId !== message.chat.id)
        replyParameters.chat_id = message.chat.id;
    }

    let replyMarkup: TG.InlineKeyboardMarkup | TG.ReplyKeyboardMarkup | undefined;

    if (init.keyboard)
      replyMarkup = this.processKeyboard(init.keyboard);

    const baseArgs = {
      chat_id: chatId,
      reply_parameters: replyParameters,
      reply_markup: replyMarkup,
      parse_mode: init.parseMode
    };

    if (init.photo) {
      return this.messages.receive(await this.api.call("sendPhoto",
        {
          ...baseArgs, photo: typeof init.photo === "string" ? init.photo : init.photo.sizes[0].id,
          caption: init.text
        }
      ));
    }
    else if (init.text) {
      return this.messages.receive(await this.api.call("sendMessage", { ...baseArgs, text: init.text }));
    }

    throw new Error("Invalid message init");
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
    await this.init();

    this.handlers.set("message", this.handleNewMessage.bind(this));
    this.handlers.set("callback_query", this.handleCallbackQuery.bind(this));
    
    this.abortController = new AbortController();
    let updateOffset: number | undefined = undefined;
    
    try {
      this.safeEmit("start");

      while (!this.abortController.signal.aborted) {
        const updates = await this.api.callEx("getUpdates", {
          args: {
            offset: updateOffset,
            timeout: 40
          },
          abortController: this.abortController
        });

        for (const update of updates) {
          if (!updateOffset || update.update_id >= updateOffset)
            updateOffset = update.update_id + 1;

          this.processUpdates(update);
        }
      }
    }
    catch(error) {
      if (!(error instanceof CanceledError))
        throw error;
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
