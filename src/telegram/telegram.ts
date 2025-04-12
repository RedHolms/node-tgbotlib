import { TelegramAPI } from "./api";
import { Message } from "../objects/messages";
import { Chat } from "../objects/chats";

class IDObjectsCache<T> {
  private Clazz: new () => T;
  private map: Map<number, T>;

  constructor(make: new () => T) {
    this.Clazz = make;
    this.map = new Map();
  }

  use(id: number): T {
    let object = this.map.get(id);
    if (!object) {
      object = new this.Clazz();
      this.map.set(id, object);
    }
    return object;
  }
}

export class Telegram {
  api: TelegramAPI;

  // objects
  private chats: IDObjectsCache<Chat>;
  private messages: IDObjectsCache<Message>;

  constructor() {
    this.api = new TelegramAPI();
    this.chats = new IDObjectsCache(Chat);
  }

  useChat(id: number): Chat {
    let object = this.chats.get(id);
    if (!object) {
      object = new Message();
      this.messages.set(id, object);
    }
    return object;
  }

  useMessage(id: number): Message {
    let object = this.messages.get(id);
    if (!object) {
      object = new Message();
      this.messages.set(id, object);
    }
    return object;
  }
}
