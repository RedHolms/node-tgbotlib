export interface FileDownloadProgress {
  file:  File;
  total: number; // bytes
  done:  number; // bytes
  speed: number; // bytes/second
}

export type FileDownloadCallback = (progress: FileDownloadProgress) => void;

export interface File {
  readonly id: string;
  readonly uniqueId: string;
  readonly size?: number;
  readonly path?: string;

  download(destPath: string, callback?: FileDownloadCallback): Promise<void>;
}
