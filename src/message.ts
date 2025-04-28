import { KeyboardType  } from "./keyboard";
import { Photo } from "./photo";
import { TGObject, TGObjectStorage, _BOT, _STORAGE } from "./tgObject";
import type { Chat } from "./chat";
import type { BotBase } from "./index";
import type { Keyboard } from "./keyboard";
import type TG from "./tg";
import type { User } from "./user";
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
  declare id: number;
  declare accessible: boolean; // can be false if message was deleted or bot just can't access it
  declare chat: Chat;
  declare sender?: User;
  declare sentAt: number; // unix seconds
  declare type: MessageType;

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

    return this[_STORAGE].receive(result);
  }

  async delete(): Promise<void> {
    await this[_BOT].api.call("deleteMessage", { chat_id: this.chat.id, message_id: this.id });
    this.accessible = false;
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
  declare type: MessageType.TEXT;
  declare text: string;

  constructor(bot: BotBase, storage: MessagesStorage) {
    super(bot, storage);
    this.type = MessageType.TEXT;
  }
};

export class PhotoMessage extends MessageBase {
  declare type: MessageType.PHOTO;
  declare photo: Photo;
  declare caption?: string;

  constructor(bot: BotBase, storage: MessagesStorage) {
    super(bot, storage);
    this.type = MessageType.PHOTO;
  }
};

export class UnknownMessage extends MessageBase {
  declare type: MessageType.UNKNOWN;

  constructor(bot: BotBase, storage: MessagesStorage) {
    super(bot, storage);
    this.type = MessageType.UNKNOWN;
  }
};

export type Message = TextMessage | PhotoMessage | UnknownMessage;

export class MessagesStorage extends TGObjectStorage<Message, TG.Message> {
  extractId(message: Message) { return `${message.chat.id}_${message.id}`; }
  extractIdFromRaw(raw: TG.Message) { return `${raw.chat.id}_${raw.message_id}`; }

  fromRaw(raw: TG.Message) {
    let object: Message;

    if (raw.text !== undefined) {
      object = new TextMessage(this.bot, this);
      object.text = raw.text;
    }
    else if (raw.photo !== undefined) {
      object = new PhotoMessage(this.bot, this);
      object.photo = new Photo(raw.photo);
      if (raw.caption)
        object.caption = raw.caption;
    }
    else {
      object = new UnknownMessage(this.bot, this);
    }

    object.id = raw.message_id;
    object.chat = this.bot.chats.receive(raw.chat);
    if (raw.from)
      object.sender = this.bot.users.receive(raw.from);

    return object;
  }
  
  update(object: Message, raw: TG.Message): void {
    //TODO
  }
};

