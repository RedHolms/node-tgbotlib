export type EventsMap<T> = {
  [key in keyof T]: any[];
};

interface ConnectionInfo {
  event: string;
  callback: (...args: any) => void | Promise<void>;
  oneTime: boolean;
}

export class EventEmitter<E extends EventsMap<E>> {
  private connections: Map<number, ConnectionInfo>;
  private firstFreeId: number;

  constructor() {
    this.connections = new Map();
    this.firstFreeId = 0;
  }

  emit<K extends keyof E>(event: K, ...args: E[K]): Promise<void> {
    const promises = [];
    for (const [i, v] of this.connections) {
      if (v.event !== event)
        continue;

      if (v.oneTime)
        this.connections.delete(i);
      promises.push(v.callback(...args));
    }

    return Promise.all(promises).then(() => {});
  }

  on(event: string, callback: (...args: any[]) => void): number {
    const idx = this.firstFreeId;
    ++this.firstFreeId;
    this.connections.set(idx, { event, callback, oneTime: false });
    return idx;
  }

  once(event: string, callback?: (...args: any) => void): Promise<any[]> {
    return new Promise((resolve) => {
      const idx = this.firstFreeId;
      ++this.firstFreeId;
      this.connections.set(idx, { event, callback: (...args: any[]) => {
        if (callback)
          callback(...args);
        resolve(args);
      }, oneTime: true });
    });
  }

  off(idx: number) {
    this.connections.delete(idx);
  }
}
