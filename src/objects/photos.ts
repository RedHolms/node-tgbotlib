import { File } from "./files";
import type { TelegramBot } from "../control/bot";
import type TG from "../telegram/types";

export class PhotoSize extends File {
  declare protected _bot: TelegramBot;
  declare width: number;
  declare height: number;

  static fromRaw(value: TG.PhotoSize, bot: TelegramBot): PhotoSize {
    const object = new PhotoSize();
    object._bot = bot;
    object.width = value.width;
    object.height = value.height;
    File.fromRaw(value, bot, object);
    return object;
  }
}

export class Photo {
  declare protected _bot: TelegramBot;
  declare sizes: PhotoSize[];

  static fromRaw(value: TG.PhotoSize[], bot: TelegramBot): Photo {
    const object = new Photo();
    object._bot = bot;
    object.sizes = [];
    for (const size of value)
      object.sizes.push(PhotoSize.fromRaw(size, bot));

    // Aspect ratio is the same, so just sort depending on width
    object.sizes.sort((a, b) => a.width - b.width);
    
    return object;
  }
}
