import type { BotBase } from "./bot";
import type { User } from "./types";
import type raw from "./rawTypes";

export enum KeyboardType {
  NORMAL,
  INLINE
}

export abstract class Keyboard {
  abstract getType(): KeyboardType;
}

class NormalKeyboard extends Keyboard {
  getType() { return KeyboardType.NORMAL; }
}

class NormalKeyboardBuilder {

}

export enum InlineKeyboardButtonActionType {
  URL,
  CALLBACK,
  COPY_TEXT
}

export abstract class InlineKeyboardButtonAction {
  abstract getType(): InlineKeyboardButtonActionType;
}

export class InlineKeyboardButtonUrlAction extends InlineKeyboardButtonAction {
  declare url: string;

  getType() { return InlineKeyboardButtonActionType.URL; }
}

export class InlineKeyboardButtonCallbackAction extends InlineKeyboardButtonAction {
  declare callback: (user: User) => any | Promise<any>;

  getType() { return InlineKeyboardButtonActionType.URL; }
}

export class InlineKeyboardButtonCopyTextAction extends InlineKeyboardButtonAction {
  declare text: string;

  getType() { return InlineKeyboardButtonActionType.COPY_TEXT; }
}

export class InlineKeyboardButton {
  declare text: string;
  declare action: InlineKeyboardButtonAction;
}

export class InlineKeyboard extends Keyboard {
  declare buttons: InlineKeyboardButton[][];

  constructor() {
    super();
    this.buttons = [];
  }

  getType() { return KeyboardType.INLINE; }
}

type InlineKeyboardButtonInit = {
  text: string;
} & (
  {
    url: string;
    callback?: never;
    copyText?: never;
  } |
  {
    url?: never;
    callback: (user: User) => any | Promise<any>;
    copyText?: never;
  } |
  {
    url?: never;
    callback?: never;
    copyText: string;
  }
);

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

    let action;
    if (init.url) {
      action = new InlineKeyboardButtonUrlAction();
      action.url = init.url;
    }
    else if (init.callback) {
      action = new InlineKeyboardButtonCallbackAction();
      action.callback = init.callback;
    }
    else if (init.copyText) {
      action = new InlineKeyboardButtonCopyTextAction();
      action.text = init.copyText;
    }
    else {
      throw new Error("no inline button action");
    }
    
    button.action = action;

    row.push(button);

    return this;
  }

  build() {
    return this.keyboard;
  }
}

export class KeyboardBuilder {
  normal() {
    return new NormalKeyboardBuilder();
  }

  inline() {
    return new InlineKeyboardBuilder();
  }
}
