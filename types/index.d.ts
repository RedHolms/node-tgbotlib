export * from "./objects/chats";
export * from "./objects/files";
export * from "./objects/keyboards";
export * from "./objects/messages";
export * from "./objects/photos";
export * from "./objects/users";

import type EventEmitter from "node:events";
import type { Telegram } from "./telegram";
import type { Message } from "./objects/messages";

export type CommandCallback = (message: Message) => void | Promise<void>;

export interface LoggerLike {
  debug(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
  warn(message: any, ...args: any[]): void;
  error(message: any, ...args: any[]): void;
  fatal(message: any, ...args: any[]): void;
}

interface BotBaseEvents {
  start:    [];
  shutdown: [];
  message:  [message: Message];
}

export abstract class BotBase extends EventEmitter<BotBaseEvents> {
  declare readonly tg: Telegram;

  declare readonly botInfo: {
    readonly id: number;
    readonly firstName: string;
    readonly username: string;
    readonly canJoinGroups: boolean;
    readonly canReadAllGroupMessages: boolean;
    readonly supportsInlineQueries: boolean;
    readonly canConnectToBusinnes: boolean;
    readonly hasMainWebApp: boolean;
  };

  // Logger returned by getLogger()
  declare readonly log: LoggerLike;

  // User function to initialize bot
  abstract init(): void | Promise<void>;

  // User function to customize library logging
  // Logging is disabled by default
  getLogger(): LoggerLike;

  protected registerCommand(command: string, callback: CommandCallback): void;
  protected unregisterCommand(command: string): void;
  protected updateBotInfo(): Promise<void>;
  protected shutdown(): never;
}

// promised is resolved once bot is shutted down
export function startTgBot(clazz: new () => BotBase): Promise<void>;
