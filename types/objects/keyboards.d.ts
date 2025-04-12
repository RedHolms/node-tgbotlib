import type { User } from "./users";
import type { OneOf } from "../utils";

export enum KeyboardType {
  NORMAL,
  INLINE
}

export interface NormalKeyboard {
  readonly type: KeyboardType.NORMAL;
}

export interface InlineKeyboard {
  readonly type: KeyboardType.INLINE;
}

export type Keyboard = NormalKeyboard | InlineKeyboard;

interface NormalKeyboardButtonInit {
  text: string;
}

type InlineKeyboardButtonInit = {
  text: string;
} & OneOf<[
  { url: string; },
  { callback: (user: User) => void | Promise<void>; },
  { copyText: string; },
  {}
]>;

interface KeyboardBuilderConfig {
  inline: boolean;
  hasRow: boolean;
  buttonsInRow: number;
}

interface KeyboardBuilderBuildable<Cfg extends KeyboardBuilderConfig> {
  build(): Cfg["inline"] extends true ? InlineKeyboard : NormalKeyboard;
}

interface KeyboardBuilderRows<Cfg extends KeyboardBuilderConfig> {
  row(): KeyboardBuilderImpl<{ inline: Cfg["inline"], hasRow: true, buttonsInRow: 0 }>;
}

// Capped to 8 becuase we can't do more than 8 buttons in a row
type IncrementNumberType<N extends number> = [1, 2, 3, 4, 5, 6, 7, 8][N];

interface KeyboardBuilderButtons<Cfg extends KeyboardBuilderConfig> {
  button(init: Cfg["inline"] extends true ? InlineKeyboardButtonInit : NormalKeyboardButtonInit):
    KeyboardBuilderImpl<{
      inline: Cfg["inline"],
      hasRow: Cfg["hasRow"],
      buttonsInRow: IncrementNumberType<Cfg["buttonsInRow"]>
    }>;
}

// Compile-type verifies keyboard to be valid (no empty rows and max 8 buttons in a row)
type KeyboardBuilderImpl<Cfg extends KeyboardBuilderConfig> =
  Cfg["hasRow"] extends false ? KeyboardBuilderRows<Cfg>
  : (
    (Cfg["buttonsInRow"] extends 0 ? {} : KeyboardBuilderRows<Cfg> & KeyboardBuilderBuildable<Cfg>) &
    (Cfg["buttonsInRow"] extends 8 ? {} : KeyboardBuilderButtons<Cfg>)
  );

export class KeyboardBuilder {
  normal(): KeyboardBuilderImpl<{ inline: false, hasRow: false, buttonsInRow: 0 }>;
  inline(): KeyboardBuilderImpl<{ inline: true,  hasRow: false, buttonsInRow: 0 }>;
}
