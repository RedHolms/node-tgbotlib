import { EventEmitter } from "./emitter";
import type { EventsMap } from "./emitter";
import type { BotBase } from "./index";

export const _BOT = Symbol("ParentTGBot");

export abstract class TGObject<E extends EventsMap<E> = {}> extends EventEmitter<E> {
  protected [_BOT]: BotBase;

  constructor(bot: BotBase) {
    super();
    this[_BOT] = bot;
  }
}
