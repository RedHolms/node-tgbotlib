import { allowGC, preventGC } from "./utils";
import type { BotBase } from ".";

type Callback<E, K extends keyof E> = E[K] extends unknown[] ? ((...args: E[K]) => void | Promise<void>) : never;

export type EventsMap<T> = {
  [key in keyof T]: any[];
};

type ConnectionInfo = { callback: (...args: any) => void | Promise<void> } & ({
  oneTime: false;
  connection: WeakRef<EventConnection>;
} | {
  oneTime: true;
  connection?: never;
});

export class EventConnection {
  private constructor(public event: string) {}

  // Work-around to export this class without ability to create it outside the library
  /** @internal */
  static create(event: string) { return new EventConnection(event); }
};

// So we don't overlap with anything
const _DATA = Symbol("EventEmitterData");

/*
 * Funny part with GC here.
 * Because we're not storing any strong reference to objects in libary, these objects are free to be deleted by GC at
 *  any time user doesn't use them, but this is really bad with events. The whole point of this caching is to be able to
 *  listen for event on any object, but if object is gone - no events for it. Because of that we're forced to prevent GC
 *  with workaround so we can emit event to it later.
 */

export class EventEmitter<E extends EventsMap<E>> {
  private [_DATA]: {
    bot: BotBase;
    events: Map<keyof E, ConnectionInfo[]>;
  };

  constructor(bot: BotBase) {
    this[_DATA] = {
      bot,
      events: new Map()
    };
  }

  // really bad workaround
  /** @internal */
  protected __setBot(bot: BotBase) { this[_DATA].bot = bot; }

  /** @internal */
  emit<K extends keyof E>(event: K, ...args: E[K]): [count: number, promise: Promise<void>] {
    const eventData = this[_DATA].events.get(event);

    if (!eventData)
      return [0, Promise.resolve()];

    const newData = [];

    const promises = [];
    for (const i in eventData) {
      const v = eventData[i];
      if (!v.oneTime)
        newData.push(v);
      promises.push(v.callback(...args));
    }

    this[_DATA].events.set(event, newData);

    if (newData.length === 0)
      allowGC(this);

    return [promises.length, Promise.all(promises).then(()=>{})];
  }

  /** @internal */
  safeEmit<K extends keyof E>(event: K, ...args: E[K]): [count: number, promise: Promise<void>] {
    const [count, promise] = this.emit(event, ...args);

    return [count, (async () => {
      try {
        await promise;
      }
      catch(error: any) {
        const { log } = this[_DATA].bot;
  
        log.error(`Error while emitting "${String(event)}" event for ${this.constructor.name}`);
        log.error(error);
      }
    })()];
  }

  on<K extends keyof E>(event: K, callback: Callback<E, K>): EventConnection {
    let eventData = this[_DATA].events.get(event);
    
    if (!eventData)
      this[_DATA].events.set(event, eventData = []);

    const connection = EventConnection.create(event as string);
    eventData.push({ connection: new WeakRef(connection), callback, oneTime: false });
    preventGC(this);
    return connection;
  }
  
  once<K extends keyof E>(event: K, callback?: Callback<E, K>): Promise<
    E[K]["length"] extends 0 ? void :
    E[K]["length"] extends 1 ? E[K][0] :
    E[K]
  > {
    return new Promise<any>((resolve) => {
      let eventData = this[_DATA].events.get(event);
      
      if (!eventData)
        this[_DATA].events.set(event, eventData = []);

      eventData.push({ callback: (...args: any[]) => {
        if (args.length === 0)
          resolve(undefined);
        else if (args.length === 1)
          resolve(args[0]);
        else
          resolve(args);

        if (callback)
          callback(...args as E[K]);
      }, oneTime: true });

      preventGC(this);
    });
  }

  off(connection: EventConnection) {
    const event = connection.event;
    const eventData = this[_DATA].events.get(event as keyof E);

    if (!eventData)
      return;

    let newEventData;
    this[_DATA].events.set(
      event as keyof E,
      newEventData = eventData.filter((v) => v.connection?.deref() !== connection)
    );

    if (newEventData.length === 0)
      allowGC(this);
  }
}
