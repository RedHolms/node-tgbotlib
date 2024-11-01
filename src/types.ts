import type { BotBase } from "./bot";
import type { raw } from "./rawTypes";

export enum ChatType {
  PRIVATE,
  GROUP,
  SUPERGROUP,
  CHANNEL,
  UNKNOWN
};

export abstract class Chat {
  declare protected _bot: BotBase;
  declare id: number;

  abstract getType(): ChatType;

  async send(init: MessageInit): Promise<Message> {
    let replyParameters: raw.ReplyParameters | undefined;

    if (init.replyTo) {
      const message = init.replyTo;

      replyParameters = {
        message_id: message.id
      };

      if (this.id !== message.chat.id)
        replyParameters.chat_id = message.chat.id;
    }

    return Message.fromRaw(
      await this._bot.api.call("sendMessage", {
        chat_id: this.id,
        text: init.text,
        reply_parameters: replyParameters
      }),
      this._bot
    );
  }

  static fromRaw(value: raw.Chat, bot: BotBase): Chat {
    const { id, type } = value;

    switch (type) {
      case "private": {
        const object = new PrivateChat();
        object._bot = bot;
        object.id = id;
        object.firstName = value.first_name;
        object.lastName = value.last_name;
        object.username = value.username;
        return object;
      }
      // case "channel":
      // case "group":
      // case "supergroup":
      //   break;
      default: {
        bot.log.warn(`Unknown chat type "${type}"`);
        const object = new UnknownChat();
        object._bot = bot;
        object.id = id;
        return object;
      }
    }
  }
};

export class PrivateChat extends Chat {
  declare firstName: string;
  declare lastName?: string;
  declare username?: string;

  getType() { return ChatType.PRIVATE; }
};

export class UnknownChat extends Chat {
  getType() { return ChatType.UNKNOWN; }
};

export class File {
  declare protected _bot: BotBase;
  declare id: string;
  declare uniqueId: string;
  declare size?: number;
  declare path?: string;

  static fromRaw(value: raw.File, bot: BotBase): File {
    const object = new File();
    object._bot = bot;
    object.id = value.file_id;
    object.uniqueId = value.file_unique_id;
    object.size = value.file_size;
    object.path = value.file_path;
    return object;
  }
};

export class PhotoSize {
  declare protected _bot: BotBase;
  declare file: File;
  declare width: number;
  declare height: number;

  static fromRaw(value: raw.PhotoSize, bot: BotBase): PhotoSize {
    const object = new PhotoSize();
    object._bot = bot;
    object.file = File.fromRaw(value, bot);
    object.width = value.width;
    object.height = value.height;
    return object;
  }
};

export class Photo {
  declare protected _bot: BotBase;
  declare sizes: PhotoSize[];

  static fromRaw(value: raw.PhotoSize[], bot: BotBase): Photo {
    const object = new Photo();
    object._bot = bot;
    object.sizes = [];
    for (const size of value)
      object.sizes.push(PhotoSize.fromRaw(size, bot));

    // Aspect ratio is the same, so just sort depending on width
    object.sizes.sort((a, b) => a.width - b.width);
    
    return object;
  }
};

export class MediaGroup {
  declare id: string;
  declare messages: Message[];
};

export type MessageInitWithoutReply = {
  text: string;
};

export type MessageInit = MessageInitWithoutReply & ({
  replyTo: undefined;
  replyOptions: undefined;
} | {
  replyTo: Message;
  replyOptions: undefined;
} | {
  replyTo: undefined;
  replyOptions: {};
});

export class Message {
  declare protected _bot: BotBase;
  declare id: number;
  declare chat: Chat;
  declare sender?: User;
  declare photos: Photo[];
  declare mediaGroup?: MediaGroup;

  reply(init: MessageInitWithoutReply): Promise<Message> {
    return this.chat.send({
      ...init,
      replyTo: this,
      replyOptions: undefined
    });
  }

  static fromRaw(value: raw.Message, bot: BotBase): Message {
    const object = new Message();
    object._bot = bot;
    object.id = value.message_id;
    object.chat = Chat.fromRaw(value.chat, bot);
    object.photos = [];
    if (value.media_group_id)
      object.mediaGroup = bot.useMediaGroup(value.media_group_id, object);
    return object;
  }
};


export class User {
  declare protected _bot: BotBase;
  declare id: number;
  declare firstName: string;
  declare lastName?: string;
  declare username?: string;
  declare languageCode?: string;
  declare isBot: boolean;
  declare isPremium: boolean;
  declare isAddedToAttachmentMenu: boolean;

  toChat(): PrivateChat {
    const object = new PrivateChat();
    object.id = this.id;
    object.firstName = this.firstName;
    object.lastName = this.lastName;
    object.username = this.username;
    return object;
  }

  static fromRaw(value: raw.User, bot: BotBase): User {
    const object = new User();
    object._bot = bot;
    object.id = value.id;
    object.firstName = value.first_name;
    object.lastName = value.last_name;
    object.username = value.username;
    object.languageCode = value.language_code;
    object.isBot = value.is_bot;
    object.isPremium = value.is_premium || false;
    object.isAddedToAttachmentMenu = value.added_to_attachment_menu || false;
    return object;
  }
};
