import { readFile } from "node:fs/promises";
import readline from "node:readline";
import { BotUpdatesManager } from "./updates";
import { Keyboard, KeyboardType, InlineKeyboard, InlineKeyboardButtonActionType, InlineKeyboardButtonUrlAction, InlineKeyboardButtonCopyTextAction, InlineKeyboardButtonCallbackAction } from "../objects/keyboards";
import { Message, MediaGroup } from "../objects/messages";
import { User } from "../objects/users";
import { isPathExists } from "../utils/paths";
import { LoggerLike } from "../utils/types";
import { TelegramUpdateFetcher } from "./updates/updateFetcher";
import { TelegramLongPollUpdateFetcher } from "./updates/longpoll";
import { EventEmitter } from "../emitter";
import type TG from "../telegram/types";
import { Telegram } from "../telegram/telegram";

type CommandCallback = (message: Message) => any | Promise<any>;

interface LibConfig {
  botToken: string;
}

interface TelegramBotEvents {
  start:    [];
  shutdown: [];
  message:  [message: Message];
}

export abstract class TelegramBot extends EventEmitter<TelegramBotEvents> {
  declare tg: Telegram;
  declare log: LoggerLike;

  declare private updateFetcher: TelegramUpdateFetcher;
  declare updatesManager: BotUpdatesManager;

  declare private infoUpdateTimeout?: NodeJS.Timeout;
  
  declare commands: Map<string, CommandCallback>;
  declare mediaGroups: Map<string, MediaGroup>;
  declare inlineCalbacks: Map<string, (user: User) => any | Promise<any>>;
  declare inlineCalbacksKeys: Map<(user: User) => any | Promise<any>, string>;

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
    this.commands = new Map();
    this.mediaGroups = new Map();
    this.inlineCalbacks = new Map();
  }

  abstract init(): void | Promise<void>;

  async start() {
    this.log = this.getLogger();
    
    await this.loadConfig();

    this.log.debug("Getting bot info");
    await this.updateBotInfo();

    this.updateFetcher = new TelegramLongPollUpdateFetcher(this.tg.api, this.log);
    this.updatesManager = new BotUpdatesManager(this, this.updateFetcher);

    if (process.platform === "win32") {
      const cl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    
      cl.on("SIGINT", function () {
        process.emit("SIGINT");
      });
    }

    process.on("SIGINT", () => {
      this.log.debug("Got interrupt");
      this.shutdown();
    });

    this.log.info("Starting...");
    
    await this.init();
    await this.safeEmit("start");
    await this.updateFetcher.start();
    await this.safeEmit("shutdown");

    this.log.info("Bot exited");
  }

  async safeEmit<K extends keyof TelegramBotEvents>(event: K, ...args: TelegramBotEvents[K]): Promise<void> {
    try {
      await this.emit(event, ...args);
    }
    catch(error: any) {
      this.log.error(`Error in event ${event}`);
      this.log.error(error);
    }
  }

  private async loadConfig() {
    if (!await isPathExists(".tgbotlib")) {
      console.error("You need to create config file (\".tgbotlib\") in root of your project");
      console.error("Check example (\".tgbotlib.in\") in library github repository");
      process.exit(0);
    }

    const content = await readFile(".tgbotlib", "utf-8");
    const config: LibConfig = JSON.parse(content);

    this.tg.api.setToken(config.botToken);
  }

  useMediaGroup(id: string, message: Message): MediaGroup {
    let group = this.mediaGroups.get(id);

    if (!group) {
      group = new MediaGroup();
      group.id = id;
      group.messages = [ message ];
      this.mediaGroups.set(id, group);
      return group;
    }

    if (!group.messages.find((v) => v.id === message.id)) {
      group.messages.push(message);
      group.messages.sort((a, b) => a.id - b.id);
    }

    return group;
  }

  private generateUniqueKey(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-0123456789";
    const charactersLength = characters.length;
  
    let result = "";
    let counter = 0;
  
    while (counter < 64) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      ++counter;
    }
  
    return result;
  }

  private hashInlineCallback(callback: (user: User) => any | Promise<any>): string {
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

  processKeyboard(keyboard: Keyboard): TG.InlineKeyboardMarkup | TG.ReplyKeyboardMarkup {
    switch (keyboard.getType()) {
      case KeyboardType.INLINE: {
        const inlineKeyboard = keyboard as InlineKeyboard;
        const buttons: TG.InlineKeyboardButton[][] = [];

        for (const row of inlineKeyboard.buttons) {
          const rawRow: TG.InlineKeyboardButton[] = [];
          for (const button of row) {
            const action = button.action;
            
            const rawButton: TG.InlineKeyboardButton = {
              text: button.text
            };

            switch (action.getType()) {
              case InlineKeyboardButtonActionType.URL:
                rawButton.url = (action as InlineKeyboardButtonUrlAction).url;
                break;
              case InlineKeyboardButtonActionType.COPY_TEXT:
                rawButton.url = (action as InlineKeyboardButtonCopyTextAction).text;
                break;
              case InlineKeyboardButtonActionType.CALLBACK: {
                const { callback } = (action as InlineKeyboardButtonCallbackAction);
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
  
  /// User API
  protected registerCommand(command: string, callback: CommandCallback): void {
    this.commands.set(command, callback);
  }

  protected unregisterCommand(command: string): void {
    this.commands.delete(command);
  }

  protected async updateBotInfo(): Promise<void> {
    if (this.infoUpdateTimeout)
      clearTimeout(this.infoUpdateTimeout);
    
    const me = await this.tg.api.call("getMe");
    
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

    this.infoUpdateTimeout = setTimeout(() => this.updateBotInfo(), 6 * 60 * 60 * 1000); // 6 hours
  }

  protected shutdown() {
    this.updateFetcher.stop();
  }

  /// User defined logger
  getLogger(): LoggerLike {
    const empty = () => { return; };
    return {
      debug: empty,
      info: empty,
      warn: empty,
      error: empty,
      fatal: empty
    };
  }
}
