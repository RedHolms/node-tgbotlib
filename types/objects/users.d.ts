import type { PrivateChat } from "./chats";

export interface User {
  readonly id: number;
  readonly firstName: string;
  readonly lastName?: string;
  readonly username?: string;
  readonly languageCode?: string;
  readonly isBot: boolean;
  readonly isPremium: boolean;
  readonly isAddedToAttachmentMenu: boolean;

  toChat(): PrivateChat;
}
