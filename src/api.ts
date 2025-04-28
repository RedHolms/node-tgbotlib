import axios from "axios";
import { sleep } from "./utils";
import type { BotBase } from ".";
import type TG from "./tg";
import type { AxiosInstance } from "axios";

export interface APIErrorParameters {
  migrateToChatId?: number;
  retryAfter?: number;
}

export class APIError extends Error {
  declare readonly calledMethod: string;
  declare readonly calledArgs?: APICallArgs;
  declare readonly code: number;
  declare readonly description: string;
  declare readonly parameters: APIErrorParameters;

  constructor(calledMethod: string, calledArgs: APICallArgs | undefined, code: number, description: string, parameters: APIErrorParameters) {
    super(`TelegramAPI error when calling method ${calledMethod} (code ${code}): ${description}`);

    this.calledMethod = calledMethod;
    this.calledArgs = calledArgs;
    this.code = code;
    this.description = description;
    this.parameters = parameters;
  }
}

type APICallArgs = Record<string, string | number | boolean | object>;

interface APIMethods {
  ["getMe"]: {
    result: TG.User & {
      can_join_groups: boolean;
      can_read_all_group_messages: boolean;
      supports_inline_queries: boolean;
      can_connect_to_business: boolean;
      has_main_web_app: boolean;
    }
  },
  ["sendMessage"]: {
    args: {
      chat_id: number | `@${string}`,
      text: string,
      business_connection_id?: string,
      message_thread_id?: number,
      parse_mode?: TG.ParseMode,
      entities?: TG.MessageEntity[],
      link_preview_options?: TG.LinkPreviewOptions,
      disable_notification?: boolean,
      protect_content?: boolean,
      message_effect_id?: string,
      reply_parameters?: TG.ReplyParameters,
      reply_markup?: TG.InlineKeyboardMarkup | TG.ReplyKeyboardMarkup | TG.ReplyKeyboardRemove | TG.ForceReply
    },
    result: TG.Message
  },
  ["sendPhoto"]: {
    args: {
      chat_id: number | `@${string}`,
      photo: string,
      caption?: string,
      business_connection_id?: string,
      message_thread_id?: number,
      parse_mode?: TG.ParseMode,
      entities?: TG.MessageEntity[],
      link_preview_options?: TG.LinkPreviewOptions,
      disable_notification?: boolean,
      protect_content?: boolean,
      message_effect_id?: string,
      reply_parameters?: TG.ReplyParameters,
      reply_markup?: TG.InlineKeyboardMarkup | TG.ReplyKeyboardMarkup | TG.ReplyKeyboardRemove | TG.ForceReply
    },
    result: TG.Message
  },
  ["getUpdates"]: {
    args?: {
      offset?: number,
      limit?: number,
      timeout?: number,
      allowed_updates?: TG.UpdateTypes[]
    },
    result: TG.Update[]
  },
  ["answerCallbackQuery"]: {
    args: {
      callback_query_id: string;
      text?: string;
      show_alert?: boolean;
      url?: string;
      cache_time?: number;
    },
    result: void
  },
  ["editMessageText"]: {
    args: {
      business_connection_id?: string;
      chat_id?: string | number;
      message_id?: number;
      inline_message_id?: string;
      text: string;
      parse_mode?: TG.ParseMode;
      entities?: TG.MessageEntity[];
      link_preview_options?: TG.LinkPreviewOptions;
      reply_markup?: TG.InlineKeyboardMarkup;
    },
    result: TG.Message | void // void if message was inline
  },
  ["editMessageCaption"]: {
    args: {
      business_connection_id?: string;
      chat_id?: string | number;
      message_id?: number;
      inline_message_id?: string;
      caption: string;
      parse_mode?: TG.ParseMode;
      caption_entities?: TG.MessageEntity[];
      show_caption_above_media?: boolean;
      reply_markup?: TG.InlineKeyboardMarkup;
    },
    result: TG.Message | void // void if message was inline
  },
  ["editMessageMedia"]: {
    args: {
      business_connection_id?: string;
      chat_id?: string | number;
      message_id?: number;
      inline_message_id?: string;
      media: TG.InputMedia;
      reply_markup?: TG.InlineKeyboardMarkup;
    },
    result: TG.Message | void // void if message was inline
  },
  ["editMessageReplyMarkup"]: {
    args: {
      business_connection_id?: string;
      chat_id?: string | number;
      message_id?: number;
      inline_message_id?: string;
      reply_markup?: TG.InlineKeyboardMarkup;
    },
    result: TG.Message | void // void if message was inline
  },
  ["deleteMessage"]: {
    args: {
      chat_id: string | number;
      message_id: number;
    },
    result: void
  }
}

type APICallFuncArgs<Method extends keyof APIMethods> =
  APIMethods[Method] extends { args: any }
    ? [args: APIMethods[Method]["args"]]
  : APIMethods[Method] extends { args?: any }
    ? [args?: APIMethods[Method]["args"]]
    : [];

export class TelegramAPI {
  private axios?: AxiosInstance;

  constructor(private bot: BotBase) {}

  setToken(token: string) {
    this.axios = axios.create({
      baseURL: `https://api.telegram.org/bot${token}/`,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  call<M extends keyof APIMethods>(method: M, ...args: APICallFuncArgs<M>): Promise<APIMethods[M]["result"]> {
    return this.callEx(method, { args: args[0] });
  }

  async callEx(method: string, config: {
    args?: any,
    abortController?: AbortController,
    waitIfNeeded?: boolean
  }): Promise<any> {
    if (!this.axios)
      throw new Error("Set bot token before calling API");

    const { args, abortController, waitIfNeeded } = config;

    while (true) {
      const { data } = await this.axios.post<TG.Response>(method, JSON.stringify(args || {}), {
        signal: abortController?.signal,
        validateStatus: () => true
      });

      if (!data.ok) {
        if (data.parameters?.retry_after && waitIfNeeded) {
          this.bot.log.warn("Too much requests! Waiting %d seconds before next API call", data.parameters.retry_after);
          this.bot.log.warn("While calling %s. Info: ", method, data);
          await sleep(data.parameters.retry_after * 1000);
          continue;
        }

        throw new APIError(
          method,
          args,
          data.error_code,
          data.description || "Unknown error",
          {
            migrateToChatId: data.parameters?.migrate_to_chat_id,
            retryAfter: data.parameters?.retry_after
          }
        );
      }

      return data.result;
    }
  }
}
