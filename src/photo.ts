import { TelegramFile } from "./file";
import type TG from "./tg";

export class PhotoSize extends TelegramFile {
  width: number;
  height: number;

  constructor(raw: TG.PhotoSize) {
    super(raw);
    this.width = raw.width;
    this.height = raw.height;
  }
}

export class Photo {
  sizes: PhotoSize[];

  constructor(raw: TG.PhotoSize[]) {
    this.sizes = [];
    for (const size of raw)
      this.sizes.push(new PhotoSize(size));
    this.sizes.sort((a, b) => a.width - b.width);
  }
}
