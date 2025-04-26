import axios from "axios";
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
    result: true
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

  async callEx(method: string, config: { args?: any, abortController?: AbortController }): Promise<any> {
    if (!this.axios)
      throw new Error("Set bot token before calling API");

    const { args, abortController } = config;

    const { data } = await this.axios.post<TG.Response>(method, JSON.stringify(args || {}), {
      signal: abortController?.signal,
      validateStatus: () => true
    });

    if (!data.ok) {
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
