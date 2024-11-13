import type TG from "../api/types";
import type { TelegramBot } from "../control/bot";

export class File {
  declare protected _bot: TelegramBot;
  declare id: string;
  declare uniqueId: string;
  declare size?: number;
  declare path?: string;

  static fromRaw(value: TG.File, bot: TelegramBot): File {
    const object = new File();
    object._bot = bot;
    object.id = value.file_id;
    object.uniqueId = value.file_unique_id;
    object.size = value.file_size;
    object.path = value.file_path;
    return object;
  }
}
