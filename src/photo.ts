import { File } from "./file";
import { TGObject } from "./tgObject";
import type { BotBase } from ".";
import type TG from "./tg";

export class PhotoSize extends File {
  width: number;
  height: number;

  constructor(raw: TG.PhotoSize, bot: BotBase) {
    super(raw, bot);
    this.width = raw.width;
    this.height = raw.height;
  }
}

export class Photo extends TGObject {
  sizes: PhotoSize[];

  constructor(raw: TG.PhotoSize[], bot: BotBase) {
    super(bot);
    this.sizes = [];
    for (const size of raw)
      this.sizes.push(new PhotoSize(size, bot));
    this.sizes.sort((a, b) => a.width - b.width);
  }
}
