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

