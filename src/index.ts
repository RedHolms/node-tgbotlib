import { TelegramBot } from "./control/bot";
import { KeyboardBuilder } from "./types/keyboards";

async function startTgBot(clazz: new () => TelegramBot) {
  await (new clazz()).start();
}

export { startTgBot, TelegramBot as BotBase, KeyboardBuilder };
