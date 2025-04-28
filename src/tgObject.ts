import { EventEmitter } from "./emitter";
import type { EventsMap } from "./emitter";
import type { BotBase } from "./index";

export const _BOT = Symbol("Bot");
export const _STORAGE = Symbol("Storage");

export abstract class TGObject<E extends EventsMap<E> = {}> extends EventEmitter<E> {
  protected [_BOT]: BotBase;
  protected [_STORAGE]: TGObjectStorage<TGObject<E>>;

  constructor(bot: BotBase, storage: TGObjectStorage<TGObject<E>>) {
    super(bot);
    this[_BOT] = bot;
    this[_STORAGE] = storage;
  }
}

interface FinalizationData {
  fullName: string;
  id: string;
}

export abstract class TGObjectStorage<C extends TGObject<any>, R = any> {
  protected bot: BotBase;
  protected objects: Map<string, WeakRef<C>>;
  protected finalizationRegistry: FinalizationRegistry<FinalizationData>;
  
  abstract extractId(object: C): string;
  abstract extractIdFromRaw(raw: R): string;

  abstract fromRaw(raw: R, bot: BotBase): C;
  abstract update(object: C, raw: R): void;

  constructor(bot: BotBase) {
    this.bot = bot;
    this.objects = new Map();
    this.finalizationRegistry = new FinalizationRegistry((data) => {
      this.objects.delete(data.id);
      this.bot.log.trace("TGObject %s was destroyed by GC", data.fullName);
    });
  }

  get objectsCount() { return this.objects.size; }

  private getFullObjectName(object: C) {
    return `${object.constructor.name}@${this.extractId(object)}`;
  }

  private registerNew(object: C) {
    const id = this.extractId(object);
    const fullName = this.getFullObjectName(object);
    
    this.finalizationRegistry.register(object, { fullName, id });
    
    if (this.objects.has(id)) {
      this.bot.log.warn("Trying to register TGObject %s as NEW, but it already was registered", fullName);
      console.trace();
    }
    else {
      this.bot.log.trace("New TGObject %s registered", fullName);
    }

    this.objects.set(id, new WeakRef(object));
  }

  private registerNewFromRaw(raw: R) {
    const message = this.fromRaw(raw, this.bot);
    this.registerNew(message);
    return message;
  }

  receive(raw: R): C;
  receive(id: string): C | undefined;

  receive(arg: string | R) {
    let raw: R | undefined = undefined, id: string;
    if (typeof arg === "string") {
      id = arg;
    }
    else {
      id = this.extractIdFromRaw(arg);
      raw = arg;
    }

    const object = this.objects.get(id)?.deref();
    if (!object)
      return raw !== undefined ? this.registerNewFromRaw(raw) : undefined;

    if (raw) {
      this.bot.log.trace("Updating TGObject %s", this.getFullObjectName(object));
      this.update(object, raw);
    }

    return object;
  }
};
