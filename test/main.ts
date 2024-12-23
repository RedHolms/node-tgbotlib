import log4js from "log4js";
import { startTgBot, BotBase, KeyboardBuilder } from "..";
import type { LoggerLike, Message, MessageWithPhoto } from "..";

class TestBot extends BotBase {
  override getLogger(): LoggerLike {
    log4js.configure({
      appenders: {
        console: {
          type: "stdout",
          layout: {
            type: "pattern",
            pattern: "\x1B[90m%d{dd/MM/yyyy hh:mm:ss.SSS}\x1B[39m %[%-5p%] %m"
          }
        }
      },
      categories: {
        default: {
          appenders: [ "console" ],
          level: "debug"
        }
      }
    });

    return log4js.getLogger();
  }

  onStart() {
    this.registerCommand("start", (message) => {
      message.reply({
        text: "Hello!!",
        keyboard: new KeyboardBuilder()
          .inline()
          .row()
          .button({
            text: "Hello, World!",
            url: "https://google.com"
          })
          .build()
      });
    });

    this.registerCommand("shutdown", () => {
      this.shutdown();
    });
  }

  onMessage(message: Message) {
    message.reply({
      text: message.sender?.firstName || ":(",
    });
  }

  onMessageWithPhoto(message: MessageWithPhoto) {
    
  }
}

startTgBot(TestBot).then(() => process.exit(0));
