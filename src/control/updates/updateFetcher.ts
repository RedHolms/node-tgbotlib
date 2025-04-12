import type TG from "../../telegram/types";

export type UpdateHandler<T> = (update: NonNullable<T>) => Promise<any>;

export interface TelegramUpdateFetcher {
  registerUpdateHandler<K extends TG.UpdateTypes>(key: K, handler: UpdateHandler<TG.Update[K]>): void;

  // this promised is resolved after fetcher is stopeed
  start(): Promise<void>;
  stop(): Promise<void>;
}
