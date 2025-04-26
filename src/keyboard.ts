import type { Chat } from ".";
import type { User } from "./user";
import type { Awaitable, OneOf } from "./utils";

export enum KeyboardType {
  NORMAL,
  INLINE
}

export class NormalKeyboard {
  type: KeyboardType.NORMAL;

  constructor() {
    this.type = KeyboardType.NORMAL;
  }
}

interface NormalKeyboardButtonInit {
  text: string;
}

class NormalKeyboardBuilder {
  row() {
    return this;
  }
  button(init: InlineKeyboardButtonInit) {
    return this;
  }
  build() {
    return undefined as any;
  }
}

export enum InlineKeyboardButtonActionType {
  URL,
  CALLBACK,
  COPY_TEXT
}

export interface InlineKeyboardButtonUrlAction {
  type: InlineKeyboardButtonActionType.URL;
  url: string;
}

export interface InlineKeyboardButtonCallbackAction {
  type: InlineKeyboardButtonActionType.CALLBACK;
  callback: InlineCallback;
}

export interface InlineKeyboardButtonCopyTextAction {
  type: InlineKeyboardButtonActionType.COPY_TEXT;
  text: string;
}

export type InlineKeyboardButtonAction = InlineKeyboardButtonUrlAction | InlineKeyboardButtonCallbackAction | InlineKeyboardButtonCopyTextAction;

export class InlineKeyboardButton {
  declare text: string;
  declare action: InlineKeyboardButtonAction;
}

export class InlineKeyboard {
  type: KeyboardType.INLINE;
  buttons: InlineKeyboardButton[][];

  constructor() {
    this.type = KeyboardType.INLINE;
    this.buttons = [];
  }
}

export type Keyboard = NormalKeyboard | InlineKeyboard;

export type InlineCallbackResult = string | {
  text: string;
  alert?: boolean;
}

export type InlineCallback = (user: User, chat?: Chat) => Awaitable<InlineCallbackResult | void>;

type InlineKeyboardButtonInit = {
  text: string;
} & OneOf<[
  { url: string; },
  { callback: InlineCallback; },
  { copyText: string; }
]>;

class InlineKeyboardBuilder {
  declare keyboard: InlineKeyboard;

  constructor() {
    this.keyboard = new InlineKeyboard();
  }

  row() {
    const { keyboard } = this;
    
    if (keyboard.buttons.length > 0 && keyboard.buttons.at(-1)!.length === 0)
      throw new Error("Trying to insert new row when previous row is empty");

    keyboard.buttons.push([]);

    return this;
  }

  button(init: InlineKeyboardButtonInit) {
    const { keyboard } = this;

    if (keyboard.buttons.length === 0)
      throw new Error("Insert row first");

    const row = keyboard.buttons.at(-1)!;

    const button = new InlineKeyboardButton();
    button.text = init.text;

    let action: InlineKeyboardButtonAction;
    if (init.url) {
      action = {
        type: InlineKeyboardButtonActionType.URL,
        url: init.url
      };
    }
    else if (init.callback) {
      action = {
        type: InlineKeyboardButtonActionType.CALLBACK,
        callback: init.callback
      };
    }
    else if (init.copyText) {
      action = {
        type: InlineKeyboardButtonActionType.COPY_TEXT,
        text: init.copyText
      };
    }
    else
      throw new Error("Text buttons are unallowed in the inline keyboard");
    
    button.action = action;

    row.push(button);

    return this;
  }

  build() {
    return this.keyboard;
  }
}

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
  normal(): KeyboardBuilderImpl<{ inline: false, hasRow: false, buttonsInRow: 0 }> {
    return new NormalKeyboardBuilder();
  }

  inline(): KeyboardBuilderImpl<{ inline: true,  hasRow: false, buttonsInRow: 0 }> {
    return new InlineKeyboardBuilder();
  }
}
