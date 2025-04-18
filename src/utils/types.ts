/*
  if Opt is undefined, gives `T | undefined`
  if Opt is true, gives `T`
  if Opt is false, gives `undefined`
 */
export type OptionalField<T, Opt> =
  Opt extends boolean
    ? Opt extends true
      ? T
      : undefined
    : T | undefined;

export type FunctionLike = (...args: any[]) => any;

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

export interface LoggerLike {
  debug(message: any, ...args: any[]): any;
  info(message: any, ...args: any[]): any;
  warn(message: any, ...args: any[]): any;
  error(message: any, ...args: any[]): any;
  fatal(message: any, ...args: any[]): any;
}
