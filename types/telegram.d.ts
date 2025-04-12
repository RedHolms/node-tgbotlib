import type { Chat } from "./objects/chats";
import type { File } from "./objects/files";
import type { User } from "./objects/users";

export interface Telegram {
  getChat(id: number): Promise<Chat | undefined>;
  getFile(id: string): Promise<File | undefined>;
  getUser(id: number): Promise<User | undefined>;
}
