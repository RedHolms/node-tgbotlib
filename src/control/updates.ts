import { Message } from "../objects/messages";
import type { TelegramBot } from "./bot";
import type { TelegramUpdateFetcher } from "./updates/updateFetcher";
import type TG from "../telegram/types";

export class BotUpdatesManager {
  declare private bot: TelegramBot;
  declare private updateFetcher: TelegramUpdateFetcher;

  constructor(bot: TelegramBot, updateFetcher: TelegramUpdateFetcher) {
    this.bot = bot;
    this.updateFetcher = updateFetcher;
    
    updateFetcher.registerUpdateHandler("message", this.processMessageUpdate.bind(this));
    updateFetcher.registerUpdateHandler("callback_query", this.processCallbackQuery.bind(this));
  }

  private async processMessageUpdate(rawMessage: TG.Message) {
    const message = Message.fromRaw(rawMessage, this.bot);
    
    const promises = [];
    promises.push(this.bot.safeEmit("message", message));

    if (rawMessage.entities) {
      for (const entity of rawMessage.entities) {
        if (entity.type === "bot_command") {
          // Here we're sure that text must be a string
          const command = rawMessage.text!.slice(entity.offset + 1, entity.offset + entity.length);

          const callback = this.bot.commands.get(command);
          if (callback)
            promises.push(callback(message));
        }
      }
    }

    await Promise.all(promises);
  }

  private async processCallbackQuery(callbackQuery: TG.CallbackQuery) {
    if (!callbackQuery.data)
      return;
  }
};
