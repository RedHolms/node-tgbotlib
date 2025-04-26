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

export class EventEmitter<E extends EventsMap<E>> {
  private [_DATA]: {
    events: Map<keyof E, ConnectionInfo[]>;
  };

  constructor() {
    this[_DATA] = {
      events: new Map()
    };
  }

  /** @internal */
  emit<K extends keyof E>(event: K, ...args: E[K]): Promise<number> {
    const eventData = this[_DATA].events.get(event);

    if (!eventData)
      return Promise.resolve(0);

    const newData = [];

    const promises = [];
    for (const i in eventData) {
      const v = eventData[i];
      if (!v.oneTime)
        newData.push(v);
      promises.push(v.callback(...args));
    }

    this[_DATA].events.set(event, newData);

    return Promise.all(promises).then(() => promises.length);
  }

  on<K extends keyof E>(event: K, callback: Callback<E, K>): EventConnection {
    let eventData = this[_DATA].events.get(event);
    
    if (!eventData)
      this[_DATA].events.set(event, eventData = []);

    const connection = EventConnection.create(event as string);
    eventData.push({ connection: new WeakRef(connection), callback, oneTime: false });
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
    });
  }

  off(connection: EventConnection) {
    const event = connection.event;
    const eventData = this[_DATA].events.get(event as keyof E);

    if (!eventData)
      return;

    this[_DATA].events.set(
      event as keyof E,
      eventData.filter((v) => v.connection?.deref() !== connection)
    );
  }
}
