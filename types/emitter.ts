import type { UniqueType } from "./utils";

type Callback<E, K extends keyof E> = E[K] extends unknown[] ? ((...args: E[K]) => void | Promise<void>) : never;

export type EventsMap<T> = {
  [key in keyof T]: unknown[];
};

export type EventConnection = UniqueType<EventConnection>;

export interface EventEmitter<E extends EventsMap<E>> {
  on<K extends keyof E>(event: K, callback: Callback<E, K>): EventConnection;

  // promise is resolved once this event is fired
  once<K extends keyof E>(event: K, callback?: Callback<E, K>): Promise<E[K]>;

  off(connection: EventConnection): void;
}
