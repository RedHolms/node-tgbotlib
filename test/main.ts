import log4js from "log4js";
import { startTgBot, BotBase } from "..";
import type { LoggerLike, Message } from "..";

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
        text: "Hello!!"
      })
    });
  }

  onMessage(message: Message) {
    message.reply(message.sender?.firstName || ":(");
  }
};

startTgBot(TestBot);
