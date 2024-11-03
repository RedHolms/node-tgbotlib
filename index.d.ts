type OptionalField<T, Opt> =
  Opt extends boolean
    ? Opt extends true
      ? T
      : never
    : T | undefined;

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

export interface ReplyOptions {
  __dummy?: string;
}

export type MessageInitWithoutReply = string | {
  text: string;
  keyboard?: Keyboard;
};

export type MessageInit = string | ({
  text: string;
  keyboard?: Keyboard;
} & (
  { replyTo: Message; replyOptions?: never } |
  { replyOptions: ReplyOptions; replyTo?: never } |
  { replyOptions?: never; replyTo?: never }
));

interface MessageConfig {
  text?: boolean;
  photo?: boolean;
}

export interface Message<Cfg extends MessageConfig = object> {
  readonly id: number;
  readonly text: OptionalField<string, Cfg["text"]>;
  readonly chat: Chat;
  readonly sender?: User;
  readonly photo: OptionalField<Photo, Cfg["photo"]>;
  readonly mediaGroup?: MediaGroup;

  reply(init: MessageInitWithoutReply): Promise<Message>;
}

export type MessageWithText = Message<{ text: true }>;
export type MessageWithPhoto = Message<{ photo: true }>;
export type TextOnlyMessage = Message<{ text: true, photo: false }>;

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

export enum KeyboardType {
  NORMAL,
  INLINE
}

export abstract class Keyboard {
  abstract getType(): KeyboardType;
}

export class NormalKeyboard {
  getType(): KeyboardType.NORMAL;
}

export class InlineKeyboard {
  getType(): KeyboardType.INLINE;
}

interface NormalKeyboardButtonInit {

}

type InlineKeyboardButtonInit = {
  text: string;
} & (
  {
    url: string;
    callback?: never;
    copyText?: never;
  } |
  {
    url?: never;
    callback: (user: User) => any | Promise<any>;
    copyText?: never;
  } |
  {
    url?: never;
    callback?: never;
    copyText: string;
  } |
  {
    url?: never;
    callback?: never;
    copyText?: never;
  }
);

// Only for KeyboadrBuilder
// Capped to 8 becuase we can't to more than 8 buttons in a row
type Increment<N> =
  N extends 0 ? 1 :
  N extends 1 ? 2 :
  N extends 2 ? 3 :
  N extends 3 ? 4 :
  N extends 4 ? 5 :
  N extends 5 ? 6 :
  N extends 6 ? 7 :
  N extends 7 ? 8 : never;

interface KeyboardBuilderConfig {
  inline: boolean;
  hasRow?: boolean;
  buttonsInRow: number | never;
}

interface KeyboardBuilderBuildable<Cfg extends KeyboardBuilderConfig> {
  build(): Cfg["inline"] extends true ? InlineKeyboard : NormalKeyboard;
}

interface KeyboardBuilderRows<Cfg extends KeyboardBuilderConfig> {
  row(): KeyboardBuilderImpl<{ inline: Cfg["inline"], hasRow: true, buttonsInRow: 0 }>;
}

interface KeyboardBuilderNormal<Cfg extends KeyboardBuilderConfig> {
  button(): KeyboardBuilderImpl<{
    inline: Cfg["inline"],
    hasRow: Cfg["hasRow"],
    buttonsInRow: Increment<Cfg["buttonsInRow"]>
  }>;
}

interface KeyboardBuilderInline<Cfg extends KeyboardBuilderConfig> {
  button(init: InlineKeyboardButtonInit):
    KeyboardBuilderImpl<{
      inline: Cfg["inline"],
      hasRow: Cfg["hasRow"],
      buttonsInRow: Increment<Cfg["buttonsInRow"]>
    }>;
}

// Seems scart but works REALLY fucking well. I wanna fall in love with TypeScript for that
// Compile-type verifies keyboard to be valid (no empty rows and max 8 buttons in a row)
type KeyboardBuilderImpl<Cfg extends KeyboardBuilderConfig> =
  (Cfg["hasRow"] extends true
    ? Cfg["buttonsInRow"] extends 0
        ? {}
        : KeyboardBuilderBuildable<Cfg>
    : {}
  ) &
  (Cfg["hasRow"] extends true
    ? Cfg["buttonsInRow"] extends 0
      ? {}
      : KeyboardBuilderRows<Cfg>
    : KeyboardBuilderRows<Cfg>
  ) &
  (Cfg["hasRow"] extends true
    ? Cfg["buttonsInRow"] extends 8
      ? {}
      : (Cfg["inline"] extends true
        ? KeyboardBuilderInline<Cfg>
        : KeyboardBuilderNormal<Cfg>
      )
    : {}
  );

export class KeyboardBuilder {
  normal(): KeyboardBuilderImpl<{ inline: false, buttonsInRow: 0 }>;
  inline(): KeyboardBuilderImpl<{ inline: true, buttonsInRow: 0 }>;
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
  // There's no point to mark Promise<any>, but
  //  that way it's more clear that these functions
  //  can be async
  onStart():                                                    any | Promise<any>;
  onShutdown():                                                 any | Promise<any>;
  onMessage(message: Message):                                  any | Promise<any>;
  onCommand(command: string, message: MessageWithText):         any | Promise<any>;
  onUnknownCommand(command: string, message: MessageWithText):  any | Promise<any>;
  onMessageWithText(message: MessageWithText):                  any | Promise<any>;
  onTextOnlyMessage(message: TextOnlyMessage):                  any | Promise<any>;
  onMessageWithPhoto(message: MessageWithPhoto):                any | Promise<any>;
}

export function startTgBot(clazz: new () => BotBase): Promise<void>;
