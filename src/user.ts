import { TGObject, TGObjectStorage, _BOT } from "./tgObject";
import type { PrivateChat } from "./chat";
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

  toChat(): PrivateChat {
    return this[_BOT].chats.receive({
      type: "private",
      id: this.id,
      first_name: this.firstName,
      last_name: this.lastName,
      username: this.username
    }) as PrivateChat;
  }
};

export class UsersStorage extends TGObjectStorage<User, TG.User> {
  extractId(user: User) { return `${user.id}`; }
  extractIdFromRaw(raw: TG.User) { return `${raw.id}`; }

  fromRaw(raw: TG.User) {
    const object = new User(this.bot, this);
    object.id = raw.id;
    this.update(object, raw);
    return object;
  }

  update(object: User, raw: TG.User): void {
    object.firstName = raw.first_name;
    object.lastName = raw.last_name;
    object.username = raw.username;
    object.languageCode = raw.language_code;
    object.isBot = raw.is_bot;
    object.isPremium = raw.is_premium || false;
    object.isAddedToAttachmentMenu = raw.added_to_attachment_menu || false;
  }
};
