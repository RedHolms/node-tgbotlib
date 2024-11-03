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
            text: "Hello, World!"
          })
          .button({
            text: "Hello, World!2"
          })
          .button({
            text: "Hello, World!3"
          })
          .button({
            text: "Hello, World!4"
          })
          .button({
            text: "Hello, World!5"
          })
          .button({
            text: "Hello, World!5"
          })
          .button({
            text: "Hello, World!5"
          })
          .button({
            text: "Hello, World!5"
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
