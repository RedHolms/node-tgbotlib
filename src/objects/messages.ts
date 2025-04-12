import { Chat } from "./chats";
import { User } from "./users";
import { Photo } from "./photos";
import type { Keyboard } from "./keyboards";
import type TG from "../telegram/types";
import type { TelegramBot } from "../control/bot";
import type { OneOf } from "../utils/types";

export class MediaGroup {
  declare id: string;
  declare messages: Message[];
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

export class Message {
  declare protected _bot: TelegramBot;
  declare id: number;
  declare text?: string;
  declare chat: Chat;
  declare sender?: User;
  declare photo?: Photo;
  declare mediaGroup?: MediaGroup;

  reply(init: MessageInitWithoutReply): Promise<Message> {
    let initObject: MessageInit;

    if (typeof init === "string") {
      initObject = {
        text: init,
        replyTo: this
      };
    }
    else {
      initObject = {
        ...init,
        replyTo: this
      };
    }

    return this.chat.send(initObject);
  }

  static fromRaw(value: TG.Message, bot: TelegramBot): Message {
    const object = new Message();
    object._bot = bot;
    object.id = value.message_id;
    object.text = value.text;
    object.chat = Chat.fromRaw(value.chat, bot);
    if (value.from)
      object.sender = User.fromRaw(value.from, bot);
    if (value.photo)
      object.photo = Photo.fromRaw(value.photo, bot);
    if (value.media_group_id)
      object.mediaGroup = bot.useMediaGroup(value.media_group_id, object);
    return object;
  }
}
