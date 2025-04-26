import { assumeIs } from "./assume";
import { parseRawMessage } from "./message";
import { Photo } from "./photo";
import { TGObject, _BOT } from "./tgObject";
import type { BotBase } from ".";
import type { Message, MessageInit, ObjectMessageInit } from "./message";
import type TG from "./tg";
import type { User } from "./user";

export enum ChatType {
  PRIVATE,
  GROUP,
  SUPERGROUP,
  CHANNEL,
  UNKNOWN
}

export interface ChatEvents {
  message: [message: Message];
}

class ChatBase extends TGObject<ChatEvents> {
  id: number;

  constructor(raw: TG.Chat | undefined, bot: BotBase) {
    super(bot);
    if (raw)
      this.id = raw.id;
    else
      this.id = 0;
  }

  async send(init: MessageInit): Promise<Message> {
    if (typeof init === "string")
      init = { text: init };
    else if (init instanceof Photo)
      init = { photo: init as Photo };

    assumeIs<ObjectMessageInit>(init);

    let replyParameters: TG.ReplyParameters | undefined;

    if (init.replyTo) {
      const message = init.replyTo;

      replyParameters = {
        message_id: message.id
      };

      if (this.id !== message.chat.id)
        replyParameters.chat_id = message.chat.id;
    }

    let replyMarkup: TG.InlineKeyboardMarkup | TG.ReplyKeyboardMarkup | undefined;

    if (init.keyboard)
      replyMarkup = this[_BOT].processKeyboard(init.keyboard);

    const baseArgs = {
      chat_id: this.id,
      reply_parameters: replyParameters,
      reply_markup: replyMarkup,
      parse_mode: init.parseMode
    };

    if (init.photo) {
      return parseRawMessage(await this[_BOT].api.call("sendPhoto",
        {
          ...baseArgs, photo: typeof init.photo === "string" ? init.photo : init.photo.sizes[0].id,
          caption: init.text
        }
      ), this[_BOT]);
    }
    else if (init.text) {
      return parseRawMessage(await this[_BOT].api.call("sendMessage", { ...baseArgs, text: init.text }), this[_BOT]);
    }

    throw new Error("Invalid message init");
  }
}

export class PrivateChat extends ChatBase {
  type: ChatType.PRIVATE;
  firstName: string;
  lastName?: string;
  username?: string;

  constructor(raw: TG.Chat & { type: "private" }, bot: BotBase);
  constructor(user: User);

  constructor(...args: any[]) {
    if (args.length === 2) {
      const [raw, bot] = args as [TG.Chat & { type: "private" }, BotBase];
      super(raw, bot);
      this.type = ChatType.PRIVATE;
      this.firstName = raw.first_name;
      this.lastName = raw.last_name;
      this.username = raw.username;
    }
    else {
      const [user] = args as [User];
      super(undefined, user[_BOT]);
      this.id = user.id;
      this.type = ChatType.PRIVATE;
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.username = user.username;
    }
  }
}

export class UnknownChat extends ChatBase {
  type: ChatType.UNKNOWN;

  constructor(raw: TG.Chat, bot: BotBase) {
    super(raw, bot);
    this.type = ChatType.UNKNOWN;
  }
}

export type Chat = PrivateChat | UnknownChat

const TYPE_TO_CLASS = new Map<string, typeof ChatBase>([
  ["private", PrivateChat]
]);

/** @internal */
export function parseRawChat(raw: TG.Chat, bot: BotBase): Chat {
  const clazz = TYPE_TO_CLASS.get(raw.type) || UnknownChat;
  return new clazz(raw, bot) as Chat;
}
