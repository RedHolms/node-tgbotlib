import { CanceledError } from "axios";
import type { TelegramUpdateFetcher } from "./updateFetcher";
import type { TelegramAPI } from "../../telegram/api";
import type TG from "../../telegram/types";
import type { FunctionLike, LoggerLike } from ".../utils/types";

export class TelegramLongPollUpdateFetcher implements TelegramUpdateFetcher {
  declare private api: TelegramAPI;
  declare private log: LoggerLike;
  declare private handlers: Map<string, FunctionLike>;

  declare private onStopped: (() => void) | null;
  declare private abortController: AbortController;
  declare private updateOffset?: number;

  constructor(api: TelegramAPI, log: LoggerLike) {
    this.api = api;
    this.log = log;
    this.handlers = new Map();
  }

  start() {
    this.abortController = new AbortController();
    return this.worker();
  }

  private async processUpdates(update: TG.Update) {
    await Promise.all((Object.keys(update) as (keyof TG.Update)[]).map((key) => {
      if (key === "update_id")
        return Promise.resolve();

      const handler = this.handlers.get(key);

      if (!handler) {
        this.log.warn(`Unknown update type "${key}"`);
        return Promise.resolve();
      }

      return handler(update[key]);
    }));
  }

  private async worker() {
    try {
      while (!this.abortController.signal.aborted) {
        const updates = await this.api.call("getUpdates", {
          offset: this.updateOffset,
          timeout: 40
        }, this.abortController);

        const promises: Promise<void>[] = [];
        for (const update of updates) {
          if (!this.updateOffset || update.update_id >= this.updateOffset)
            this.updateOffset = update.update_id + 1;

          promises.push(this.processUpdates(update));
        }

        await Promise.all(promises);
      }
    }
    catch(error) {
      if (!(error instanceof CanceledError))
        throw error;
    }

    if (this.onStopped) {
      this.onStopped();
      this.onStopped = null;
    }
  }

  stop() {
    const promise = new Promise<void>((r) => this.onStopped = r);
    this.abortController.abort();
    return promise; 
  }

  registerUpdateHandler(key: string, handler: FunctionLike): void {
    this.handlers.set(key, handler);
  }
}
