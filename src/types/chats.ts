import { Message } from "./messages";
import type { MessageInit } from "./messages";
import type TG from "../api/types";
import type { TelegramBot } from "../control/bot";

export enum ChatType {
  PRIVATE,
  GROUP,
  SUPERGROUP,
  CHANNEL,
  UNKNOWN
}

export abstract class Chat {
  declare protected _bot: TelegramBot;
  declare id: number;

  abstract getType(): ChatType;

  async send(init: MessageInit): Promise<Message> {
    if (typeof init === "string")
      init = { text: init };
    
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
      replyMarkup = this._bot.processKeyboard(init.keyboard);

    return Message.fromRaw(
      await this._bot.api.call("sendMessage", {
        chat_id: this.id,
        text: init.text,
        reply_parameters: replyParameters,
        reply_markup: replyMarkup
      }),
      this._bot
    );
  }

  static fromRaw(value: TG.Chat, bot: TelegramBot): Chat {
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
}

export class PrivateChat extends Chat {
  declare firstName: string;
  declare lastName?: string;
  declare username?: string;

  getType() { return ChatType.PRIVATE; }
}

export class UnknownChat extends Chat {
  getType() { return ChatType.UNKNOWN; }
}
