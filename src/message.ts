import { parseRawChat } from "./chat";
import { KeyboardType  } from "./keyboard";
import { Photo } from "./photo";
import { TGObject, _BOT } from "./tgObject";
import { User } from "./user";
import type { Chat } from "./chat";
import type { BotBase } from "./index";
import type { Keyboard } from "./keyboard";
import type TG from "./tg";
import type { OneOf } from "./utils";

export interface MediaGroup {
  readonly id: string;
  readonly messages: Message[];
}

export interface ReplyOptions {
  __dummy?: string;
}

export type ObjectMessageInit = OneOf<[{
  text: string;
  parseMode?: TG.ParseMode;
}, {
  photo: Photo | string;
  text?: string; // caption
  parseMode?: TG.ParseMode;
}]> & {
  keyboard?: Keyboard;
};

export type MessageInitWithoutReply = string | Photo | ObjectMessageInit;
export type MessageInit = string | Photo | (ObjectMessageInit & OneOf<[
  { replyTo: number | Message },
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
  declare type: MessageType;

  constructor(raw: TG.Message, bot: BotBase) {
    super(bot);
    this.id = raw.message_id;
    this.chat = parseRawChat(raw.chat, bot);
    if (raw.from)
      this.sender = new User(raw.from, bot);
  }

  async edit(data: string | ObjectMessageInit) {
    if (typeof data === "string")
      data = { text: data };

    let replyMarkup: TG.InlineKeyboardMarkup | undefined;

    if (data.keyboard) {
      if (data.keyboard.type !== KeyboardType.INLINE)
        throw new Error("Can edit only with inline keyboards");
      replyMarkup = this[_BOT].processKeyboard(data.keyboard) as TG.InlineKeyboardMarkup;
    }

    const baseArgs = {
      chat_id: this.chat.id,
      message_id: this.id,
      reply_markup: replyMarkup,
      parse_mode: data.parseMode
    };

    let result: TG.Message | undefined = undefined;

    if (data.photo) {
      result = await this[_BOT].api.call(
        "editMessageMedia",
        { ...baseArgs, media: {
          type: "photo",
          media: typeof data.photo === "string" ? data.photo : data.photo.sizes[0].id,
          caption: data.text
        } }
      ) as TG.Message;
      
      data.text = undefined;
      baseArgs.reply_markup = undefined;
    }

    if (data.text) {
      if (this.type === MessageType.PHOTO || this.type === MessageType.VIDEO)
        result = await this[_BOT].api.call(
          "editMessageCaption",
          { ...baseArgs, caption: data.text }
        ) as TG.Message;
      else
        result = await this[_BOT].api.call(
          "editMessageText",
          { ...baseArgs, text: data.text }
        ) as TG.Message;

      baseArgs.reply_markup = undefined;
    }

    if (baseArgs.reply_markup)
      result = await this[_BOT].api.call("editMessageReplyMarkup", baseArgs) as TG.Message;

    if (!result)
      return this;

    return parseRawMessage(result, this[_BOT]);
  }

  delete(): Promise<void> {
    return this[_BOT].api.call("deleteMessage", { chat_id: this.chat.id, message_id: this.id });
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

/** @internal */
export function parseRawMessage(raw: TG.Message, bot: BotBase): Message {
  if (raw.text !== undefined)
    return new TextMessage(raw as any, bot);
  if (raw.photo !== undefined)
    return new PhotoMessage(raw as any, bot);
  return new UnknownMessage(raw, bot);
}
