import type { File } from "./files";

export interface PhotoSize extends File {
  readonly width: number;
  readonly height: number;
}

export interface Photo {
  readonly sizes: PhotoSize[];
}
