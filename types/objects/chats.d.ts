import type { Message, MessageInit } from "./messages";
import type { EventEmitter } from "../emitter";

export enum ChatType {
  PRIVATE,
  GROUP,
  SUPERGROUP,
  CHANNEL,
  UNKNOWN
}

interface ChatEvents {
  message: [message: Message];
}

interface ChatBase extends EventEmitter<ChatEvents> {
  readonly id: number;

  send(init: MessageInit): Promise<Message>;
}

export interface PrivateChat extends ChatBase {
  readonly type: ChatType.PRIVATE;
  readonly firstName: string;
  readonly lastName?: string;
  readonly username?: string;
}

export interface UnknownChat extends ChatBase {
  readonly type: ChatType.UNKNOWN;
}

export type Chat = PrivateChat | UnknownChat;
