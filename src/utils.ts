type MergeTypes<TypesArray extends any[], Res = {}> =
  TypesArray extends [infer Head, ...infer Rem]
    ? MergeTypes<Rem, Res & Head>
    : Res;

type OnlyFirst<F, S> = F & {[Key in keyof Omit<S, keyof F>]?: never};

export type OneOf<
  TypesArray extends any[],
  Res = never,
  AllProperties = MergeTypes<TypesArray>
> =
  TypesArray extends [infer Head, ...infer Rem]
    ? OneOf<Rem, Res | OnlyFirst<Head, AllProperties>, AllProperties>
    : Res;

declare namespace Mark { const Mark: unique symbol; }

// Create non-castable type without real implementation
export interface UniqueType<T> { [Mark.Mark]: T; }

export type Awaitable<T> = T | PromiseLike<T>;

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const PreventationRegistry = new Map<object, 1>();
export function preventGC(obj: object) { PreventationRegistry.set(obj, 1); }
export function allowGC(obj: object) { PreventationRegistry.delete(obj); }
