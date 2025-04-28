import { TGObject, TGObjectStorage, _BOT } from "./tgObject";
import type { BotBase } from ".";
import type { Message, MessageInit } from "./message";
import type TG from "./tg";

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
  declare id: number;
  declare type: ChatType;

  send(init: MessageInit): Promise<Message> {
    return this[_BOT].sendMessage(this.id, init);
  }
}

export class PrivateChat extends ChatBase {
  declare type: ChatType.PRIVATE;
  declare firstName: string;
  declare lastName?: string;
  declare username?: string;

  constructor(bot: BotBase, storage: ChatsStorage) {
    super(bot, storage);
    this.type = ChatType.PRIVATE;
  }
}

export class UnknownChat extends ChatBase {
  type: ChatType.UNKNOWN;

  constructor(bot: BotBase, storage: ChatsStorage) {
    super(bot, storage);
    this.type = ChatType.UNKNOWN;
  }
}

export type Chat = PrivateChat | UnknownChat;

export class ChatsStorage extends TGObjectStorage<Chat, TG.Chat> {
  extractId(chat: Chat) { return `${chat.id}`; }
  extractIdFromRaw(raw: TG.Chat) { return `${raw.id}`; }

  fromRaw(raw: TG.Chat) {
    let object: Chat;

    switch (raw.type) {
      case "private":
        object = new PrivateChat(this.bot, this);
        object.firstName = raw.first_name;
        object.lastName = raw.last_name;
        object.username = raw.username;
        break;
      default:
        object = new UnknownChat(this.bot, this);
        break;
    }

    object.id = raw.id;

    return object;
  }

  update(object: Chat, raw: TG.Chat): void {
    switch (object.type) {
      case ChatType.PRIVATE:
        if (raw.type !== "private")
          throw new Error(`Chat type changed in chat ${raw.id}: was ${ChatType[object.type]}, now ${raw.type}`);
        object.firstName = raw.first_name;
        object.lastName = raw.last_name;
        object.username = raw.username;
        break;
      case ChatType.UNKNOWN:
        break;
    }
  }
};
