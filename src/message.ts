import { User } from "./user";
import { BotBase } from ".";
import { TGObject } from "./tgObject";
import TG from "./tg";
import { Chat, parseRawChat } from "./chat";
import { Photo } from "./photo";
import { Keyboard } from "./keyboard";
import { OneOf } from "./utils";

export interface MediaGroup {
  readonly id: string;
  readonly messages: Message[];
}

export interface ReplyOptions {
  __dummy?: string;
}

export type ObjectMessageInit = OneOf<[{
  text: string;
}, {
  photo: Photo | string;
  text?: string; // caption
}]> & {
  keyboard?: Keyboard;
};

export type MessageInitWithoutReply = string | Photo | ObjectMessageInit;
export type MessageInit = string | Photo | (ObjectMessageInit & OneOf<[
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

export interface MessageEvents {
  reply:  [reply: Message];
  // Once message is edited, it's object automaticly updated
  edit:   [];
  delete: [];
}

abstract class MessageBase extends TGObject<MessageEvents> {
  id: number;
  chat: Chat;
  sender?: User;

  constructor(raw: TG.Message, bot: BotBase) {
    super(bot);
    this.id = raw.message_id;
    this.chat = parseRawChat(raw.chat, bot);
    if (raw.from)
      this.sender = new User(raw.from, bot);
  }

  reply(init: MessageInitWithoutReply): Promise<Message> {
    let initObject: MessageInit;

    if (typeof init === "string") {
      initObject = {
        text: init,
        replyTo: this as any
      };
    }
    else {
      initObject = {
        ...init,
        replyTo: this as any
      } as MessageInit;
    }

    return this.chat.send(initObject);
  }
};

export class TextMessage extends MessageBase {
  type: MessageType.TEXT;
  text: string;

  constructor(raw: TG.Message & { text: string }, bot: BotBase) {
    super(raw, bot);
    this.type = MessageType.TEXT;
    this.text = raw.text;
  }
};

export class PhotoMessage extends MessageBase {
  type: MessageType.PHOTO;
  photo: Photo;
  caption?: string;

  constructor(raw: TG.Message & { photo: TG.PhotoSize[] }, bot: BotBase) {
    super(raw, bot);
    this.type = MessageType.PHOTO;
    this.photo = new Photo(raw.photo, bot);
    if (raw.caption)
      this.caption = raw.caption;
  }
};

export class UnknownMessage extends MessageBase {
  type: MessageType.UNKNOWN;

  constructor(raw: TG.Message, bot: BotBase) {
    super(raw, bot);
    this.type = MessageType.UNKNOWN;
  }
};

export type Message = TextMessage | PhotoMessage | UnknownMessage;

export function parseRawMessage(raw: TG.Message, bot: BotBase): Message {
  if (raw.text !== undefined)
    return new TextMessage(raw as any, bot);
  if (raw.photo !== undefined)
    return new PhotoMessage(raw as any, bot);
  return new UnknownMessage(raw, bot);
}
