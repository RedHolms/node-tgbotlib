export class PhotoSize {
  declare protected _bot: BotBase;
  declare file: File;
  declare width: number;
  declare height: number;

  static fromRaw(value: raw.PhotoSize, bot: BotBase): PhotoSize {
    const object = new PhotoSize();
    object._bot = bot;
    object.file = File.fromRaw(value, bot);
    object.width = value.width;
    object.height = value.height;
    return object;
  }
}

export class Photo {
  declare protected _bot: BotBase;
  declare sizes: PhotoSize[];

  static fromRaw(value: raw.PhotoSize[], bot: BotBase): Photo {
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
