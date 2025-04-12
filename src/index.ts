import { TelegramBot } from "./control/bot";
import { ChatType } from "./objects/chats";
import { KeyboardBuilder, KeyboardType } from "./objects/keyboards";

async function startTgBot(clazz: new () => TelegramBot) {
  try {
    await (new clazz()).start();
  }
  catch(error) {
    console.error("Unhandled error in bot");
    console.error(error);
  }
}

export {
  startTgBot, TelegramBot as BotBase, KeyboardBuilder,
  ChatType, KeyboardType
};
