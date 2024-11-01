import { BotBase } from "./bot";

async function startTgBot(clazz: new () => BotBase) {
  await (new clazz()).start();
}

export { startTgBot, BotBase };
