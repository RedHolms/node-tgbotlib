/*
  if Opt is undefined, gives `T | undefined`
  if Opt is true, gives `T`
  if Opt is false, gives `undefined`
 */
export type OptionalField<T, Opt> =
  Opt extends boolean
    ? Opt extends true
      ? T
      : never
    : T | undefined;

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
