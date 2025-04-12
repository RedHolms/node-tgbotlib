import type { Chat } from "./chats";
import type { Keyboard } from "./keyboards";
import type { Photo } from "./photos";
import type { User } from "./users";
import type { EventEmitter } from "../emitter";
import type { OneOf } from "../utils";

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
}

export type MessageInit = string | ({
  text: string;
  keyboard?: Keyboard;
} & OneOf<[
  { replyTo: Message },
  { replyOptions: ReplyOptions },
  {}
]>);

export enum MessageType {
  TEXT,
  PHOTO,
  VIDEO,
  UNKNOWN
}

interface MessageEvents {
  reply:  [reply: Message];
  // Once message is edited, it's object automaticly updated
  edit:   [];
  delete: [];
}

interface MessageBase extends EventEmitter<MessageEvents> {
  readonly id: number;
  readonly chat: Chat;
  readonly sender?: User;

  reply(init: MessageInitWithoutReply): Promise<Message>;
}

export interface TextMessage extends MessageBase {
  readonly type: MessageType.TEXT;
  readonly text: string;
}

export interface PhotoMessage extends MessageBase {
  readonly type: MessageType.PHOTO;
  readonly photo: Photo;
  readonly caption?: string;
}

export interface VideoMessage extends MessageBase {
  readonly type: MessageType.VIDEO;
  // readonly video: Video;
  readonly caption?: string;
}

export interface UnknownMessage extends MessageBase {
  readonly type: MessageType.UNKNOWN;
}

export type Message = TextMessage | PhotoMessage | VideoMessage | UnknownMessage;
