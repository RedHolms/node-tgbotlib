import { readFile } from "node:fs/promises";

import { TelegramAPI } from "./api";
import { MediaGroup, Message } from "./types";
import { isPathExists } from "./utils";
import type raw from "./rawTypes";

type CommandCallback = (message: Message) => any | Promise<any>;

interface LoggerLike {
  debug(message: any, ...args: any[]): any;
  info(message: any, ...args: any[]): any;
  warn(message: any, ...args: any[]): any;
  error(message: any, ...args: any[]): any;
  fatal(message: any, ...args: any[]): any;
};

interface LibConfig {
  botToken: string;
};

interface UpdatesHandlersMap {
  get<K extends raw.UpdateTypes>(key: K): ((object: raw.Update[K]) => Promise<void>) | undefined;
};

export abstract class BotBase {
  declare readonly api: TelegramAPI;
  
  declare private _log: LoggerLike;
  get log() { return this._log; }

  declare private infoUpdateTimeout?: NodeJS.Timeout;
  
  declare private commands: Map<string, CommandCallback>;
  declare private mediaGroups: Map<string, MediaGroup>;
  
  declare private updateOffset?: number;
  declare private updatesHandlers: UpdatesHandlersMap;

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
    this.api = new TelegramAPI();
    this.commands = new Map();
    this.mediaGroups = new Map();

    this.updatesHandlers = new Map<raw.UpdateTypes, (object: any) => Promise<void>>([
      [ "message", this.processMessageUpdate.bind(this) ]
    ]);
  }

  async start() {
    await this.loadConfig();

    await this.updateBotInfo();
    this._log = this.getLogger();

    this.log.info("Starting...");

    this.log.debug("Calling user start");
    await this.onStart();

    this.log.debug("Starting longpoll cycle");
    await this.longpollCycle();
  }

  private async processMessageUpdate(rawMessage: raw.Message) {
    const message = Message.fromRaw(rawMessage, this);
    
    const promises = [];
    promises.push(this.onMessage(message));
    
    let haveCommands = false;
    if (rawMessage.entities) {
      for (const entity of rawMessage.entities) {
        if (entity.type === "bot_command") {
          haveCommands = true;
          
          // Here we're sure that text must be a string
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const command = rawMessage.text!.slice(entity.offset + 1, entity.offset + entity.length);

          promises.push(this.onCommand(command, message));

          const callback = this.commands.get(command);
          if (callback)
            promises.push(callback(message));
          else
            promises.push(this.onUnknownCommand(command, message));
        }
      }
    }

    if (!haveCommands && rawMessage.text)
      promises.push(this.onTextMessage(rawMessage.text, message));

    await Promise.all(promises);
  }

  private async processUpdates(update: raw.Update) {
    await Promise.all((Object.keys(update) as (keyof raw.Update)[]).map((key) => {
      if (key === "update_id")
        return Promise.resolve();

      const handler = this.updatesHandlers.get(key);

      if (!handler) {
        this.log.warn(`Unknown update type "${key}"`);
        return Promise.resolve();
      }

      return handler(update[key]);
    }));
  }

  private async longpollCycle() {
    this.log.info("Started");

    while (true) {
      const updates = await this.api.call("getUpdates", {
        offset: this.updateOffset as any,
        timeout: 40
      });

      const promises: Promise<void>[] = [];
      for (const update of updates) {
        if (!this.updateOffset || update.update_id >= this.updateOffset)
          this.updateOffset = update.update_id + 1;

        promises.push(this.processUpdates(update));
      }

      await Promise.all(promises);
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

    this.api.setToken(config.botToken);
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
    
    const me = await this.api.call("getMe");
    
    this.botInfo = {
      id: me.id,
      firstName: me.first_name,
      // Bots always have a name
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      username: me.username!,
      canJoinGroups: me.can_join_groups,
      canReadAllGroupMessages: me.can_read_all_group_messages,
      supportsInlineQueries: me.supports_inline_queries,
      canConnectToBusinnes: me.can_connect_to_business,
      hasMainWebApp: me.has_main_web_app
    };

    this.infoUpdateTimeout = setTimeout(() => this.updateBotInfo(), 6 * 60 * 60 * 1000); // 6 hours
  }

  protected shutdown() {
    return;
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
  
  /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

  /// User callbacks
  onStart():                                            any | Promise<any> {}
  onShutdown():                                         any | Promise<any> {}
  onMessage(message: Message):                          any | Promise<any> {}
  onCommand(command: string, message: Message):         any | Promise<any> {}
  onUnknownCommand(command: string, message: Message):  any | Promise<any> {}
  onTextMessage(text: string, message: Message):        any | Promise<any> {}
};
