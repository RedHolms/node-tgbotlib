import { PrivateChat } from "./chat";
import { TGObject } from "./tgObject";
import type { BotBase } from "./index";
import type TG from "./tg";

export class User extends TGObject {
  declare id: number;
  declare firstName: string;
  declare lastName?: string;
  declare username?: string;
  declare languageCode?: string;
  declare isBot: boolean;
  declare isPremium: boolean;
  declare isAddedToAttachmentMenu: boolean;

  constructor(raw: TG.User, bot: BotBase) {
    super(bot);
    this.id = raw.id;
    this.firstName = raw.first_name;
    this.lastName = raw.last_name;
    this.username = raw.username;
    this.languageCode = raw.language_code;
    this.isBot = raw.is_bot;
    this.isPremium = raw.is_premium || false;
    this.isAddedToAttachmentMenu = raw.added_to_attachment_menu || false;
  }

  toChat(): PrivateChat {
    return new PrivateChat(this);
  }
};
