import { Chat } from "./chats";
import { User } from "./users";
import { Photo } from "./photos";
import type { Keyboard } from "./keyboards";
import type TG from "../api/types";
import type { TelegramBot } from "../control/bot";
import type { OptionalField } from "../utils/types";

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
} & (
  { replyTo: Message; replyOptions?: never } |
  { replyOptions: ReplyOptions; replyTo?: never } |
  { replyOptions?: never; replyTo?: never}
));

interface MessageConfig {
  text?: boolean;
  photo?: boolean;
}

export class Message<Cfg extends MessageConfig = object> {
  declare protected _bot: TelegramBot;
  declare id: number;
  declare text: OptionalField<string, Cfg["text"]>;
  declare chat: Chat;
  declare sender?: User;
  declare photo?: OptionalField<Photo, Cfg["photo"]>;
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

export type MessageWithText = Message<{ text: true }>;
export type MessageWithPhoto = Message<{ photo: true }>;
export type TextOnlyMessage = Message<{ text: true, photo: false }>;
