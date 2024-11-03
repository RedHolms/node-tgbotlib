import { BotBase } from "./bot";
import { KeyboardBuilder } from "./keyboards";

async function startTgBot(clazz: new () => BotBase) {
  await (new clazz()).start();
}

export { startTgBot, BotBase, KeyboardBuilder };
