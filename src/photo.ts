import { BotBase } from ".";
import { File } from "./file";
import TG from "./tg";
import { TGObject } from "./tgObject";

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
