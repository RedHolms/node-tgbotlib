import axios from "axios";
import type { AxiosInstance } from "axios";

import type raw from "./rawTypes";

export interface APIErrorParameters {
  migrateToChatId?: number;
  retryAfter?: number;
};

export class APIError extends Error {
  declare readonly calledMethod: string;
  declare readonly code: number;
  declare readonly description: string;
  declare readonly parameters: APIErrorParameters;

  constructor(calledMethod: string, code: number, description: string, parameters: APIErrorParameters) {
    super(`TelegramAPI error when calling method ${calledMethod} (code ${code}): ${description}`);

    this.calledMethod = calledMethod;
    this.code = code;
    this.description = description;
    this.parameters = parameters;
  }
};

interface APICallArgs {
  [name: string]: string | number | boolean | object;
};

export class TelegramAPI {
  declare private axios?: AxiosInstance;

  constructor(token?: string) {
    if (token)
      this.setToken(token);
  }

  setToken(token: string) {
    this.axios = axios.create({
      baseURL: `https://api.telegram.org/bot${token}/`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
  }

  call(
    method: "getMe"
  ): Promise<
    raw.User & {
      can_join_groups: boolean;
      can_read_all_group_messages: boolean;
      supports_inline_queries: boolean;
      can_connect_to_business: boolean;
      has_main_web_app: boolean;
    }
  >;
  call(
    method: "sendMessage",
    args: {
      chat_id: number | `@${string}`,
      text: string,
      business_connection_id?: string,
      message_thread_id?: number,
      parse_mode?: raw.ParseMode,
      entities?: raw.MessageEntity[],
      link_preview_options?: raw.LinkPreviewOptions,
      disable_notification?: boolean,
      protect_content?: boolean,
      message_effect_id?: string,
      reply_parameters?: raw.ReplyParameters,
      reply_markup?: raw.InlineKeyboardMarkup | raw.ReplyKeyboardMarkup | raw.ReplyKeyboardRemove | raw.ForceReply
    }
  ): Promise<
    raw.Message
  >;
  call(
    method: "getUpdates",
    args?: {
      offset?: number,
      limit?: number,
      timeout?: number,
      allowed_updates?: raw.UpdateTypes[]
    }
  ): Promise<
    raw.Update[]
  >;

  async call(method: string, args?: APICallArgs, abortController?: AbortController): Promise<any> {
    if (!this.axios)
      throw new Error("Set bot token before calling API");

    const body =
      Object.entries(args || {})
        .filter(([,v]) => v !== undefined && v !== null)
        .map(
          ([key, value]) => {
            if (typeof value === "object")
              value = JSON.stringify(value);

            return [key, value].map(encodeURIComponent).join("=");
          }
        ).join("&");

    const { data } = await this.axios.post<raw.Response>(method, body, { signal: abortController?.signal });

    if (!data.ok) {
      throw new APIError(
        method,
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
};
