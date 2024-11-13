import { PrivateChat } from "./chats";
import type TG from "../api/types";
import type { TelegramBot } from "../control/bot";

export class User {
  declare protected _bot: TelegramBot;
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

  static fromRaw(value: TG.User, bot: TelegramBot): User {
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
}
