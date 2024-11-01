export declare enum ChatType {
  PRIVATE,
  GROUP,
  SUPERGROUP,
  CHANNEL,
  UNKNOWN
}

export interface Chat {
  readonly id: number;

  getType(): ChatType;
  send(init: MessageInit): Promise<Message>;
}

export interface PrivateChat extends Chat {
  readonly firstName: string;
  readonly lastName?: string;
  readonly username?: string;
  
  getType(): ChatType.PRIVATE;
}

export interface UnknownChat extends Chat {
  getType(): ChatType.UNKNOWN;
}

export interface File {
  readonly id: string;
  readonly uniqueId: string;
  readonly size?: number;
  readonly path?: string;
}

export class PhotoSize {
  readonly file: File;
  readonly width: number;
  readonly height: number;
}

export interface Photo {
  readonly sizes: PhotoSize[];
}

export interface MediaGroup {
  readonly id: string;
  readonly messages: Message[];
}

export type MessageInitWithoutReply = {
  text: string;
};

export type MessageInit = MessageInitWithoutReply & ({
  replyTo: undefined;
  replyOptions: undefined;
} | {
  replyTo: Message;
  replyOptions: undefined;
} | {
  replyTo: undefined;
  replyOptions: {};
});

export interface Message {
  readonly id: number;
  readonly chat: Chat;
  readonly sender?: User;
  readonly mediaGroup?: MediaGroup;

  reply(init: MessageInitWithoutReply): Promise<Message>;
}

export interface User {
  readonly id: number;
  readonly firstName: string;
  readonly lastName?: string;
  readonly username?: string;
  readonly languageCode?: string;
  readonly isBot: boolean;
  readonly isPremium: boolean;
  readonly isAddedToAttachmentMenu: boolean;

  toChat(): PrivateChat;
}

export type CommandCallback = (message: Message) => any | Promise<any>;

// Like log4js
export interface LoggerLike {
  debug(message: any, ...args: any[]): any;
  info(message: any, ...args: any[]): any;
  warn(message: any, ...args: any[]): any;
  error(message: any, ...args: any[]): any;
  fatal(message: any, ...args: any[]): any;
}

export abstract class BotBase {
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

  /// User logger returned from "getLogger"
  declare readonly log: LoggerLike;

  protected registerCommand(command: string, callback: CommandCallback): void;
  protected unregisterCommand(command: string): void;

  protected updateBotInfo(): Promise<void>;

  protected shutdown(): never;

  // Redefine this function to customize library logging
  // Logging is disabled by default
  // This function is called once, right before "onStart"
  getLogger(): LoggerLike;

  /// User callbacks
  // There's not point to mark Promise<any>, but
  //  that way it's more clear that these functions
  //  can be async
  onStart():                                            any | Promise<any>;
  onShutdown():                                         any | Promise<any>;
  onMessage(message: Message):                          any | Promise<any>;
  onCommand(command: string, message: Message):         any | Promise<any>;
  onUnknownCommand(command: string, message: Message):  any | Promise<any>;
  onTextMessage(text: string, message: Message):        any | Promise<any>;
}

export function startTgBot(clazz: new () => BotBase): Promise<void>;
