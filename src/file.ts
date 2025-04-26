import { TGObject } from "./tgObject";
import type { BotBase } from ".";
import type TG from "./tg";

export interface FileDownloadProgress {
  file:  File;
  total: number; // bytes
  done:  number; // bytes
  speed: number; // bytes/second
}

export type FileDownloadCallback = (progress: FileDownloadProgress) => void;

export class File extends TGObject {
  id: string;
  uniqueId: string;
  size?: number;
  path?: string;

  constructor(raw: TG.File, bot: BotBase) {
    super(bot);
    this.id = raw.file_id;
    this.uniqueId = raw.file_unique_id;
    this.size = raw.file_size;
    this.path = raw.file_path;
  }

  async download(destPath: string, callback?: FileDownloadCallback): Promise<void> {}
}
