// I haven't done all types, so let's keep it for now
/* eslint-disable @typescript-eslint/no-empty-object-type */

declare namespace raw {

  export interface User {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: true;
    added_to_attachment_menu?: true;
  }
  export type ChatType =
    "private" |
    "group" |
    "supergroup" |
    "channel";
  export type Chat = ({
    id: number;
  }) & ({
    type: "private";
    username?: string;
    first_name: string;
    last_name?: string;
  } | {
    type: "group";
    title: string;
  } | {
    type: "supergroup";
    username?: string;
    title: string;
    is_forum?: true;
  } | {
    type: "channel";
    username?: string;
    title: string;
  });
  export interface ChatFullInfo {}
  export type ParseMode = "MarkdownV2" | "HTML" | "Markdown";
  export interface Message {
    message_id: number;
    message_thread_id?: number;
    from?: User;
    sender_chat?: Chat;
    sender_boost_count?: number;
    sender_business_bot?: User;
    date: number;
    business_connection_id?: string;
    chat: Chat;
    forward_origin?: MessageOrigin;
    is_topic_message?: true;
    is_automatic_forward?: true;
    reply_to_message?: Message;
    external_reply?: ExternalReplyInfo;
    quote?: TextQuote;
    reply_to_story?: Story;
    via_bot?: User;
    edit_date?: number;
    has_protected_content?: true;
    is_from_offline?: true;
    media_group_id?: string;
    author_signature?: string;
    text?: string;
    entities?: MessageEntity[];
    link_preview_options?: LinkPreviewOptions;
    effect_id?: string;
    animation?: Animation;
    audio?: Audio;
    document?: Document;
    paid_media?: PaidMediaInfo;
    photo?: PhotoSize[];
    sticker?: Sticker;
    story?: Story;
    video?: Video;
    video_note?: VideoNote;
    voice?: Voice;
    caption?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: true;
    has_media_spoiler?: true;
    contact?: Contact;
    dice?: Dice;
    game?: Game;
    poll?: Poll;
    venue?: Venue;
    location?: Location;
    new_chat_members?: User[];
    left_chat_member?: User;
    new_chat_title?: string;
    new_chat_photo?: PhotoSize[];
    delete_chat_photo?: true;
    group_chat_created?: true;
    supergroup_chat_created?: true;
    channel_chat_created?: true;
    message_auto_delete_timer_changed?: MessageAutoDeleteTimerChanged;
    migrate_to_chat_id?: number;
    migrate_from_chat_id?: number;
    pinned_message?: MaybeInaccessibleMessage;
    invoice?: Invoice;
    successful_payment?: SuccessfulPayment;
    refunded_payment?: RefundedPayment;
    users_shared?: UsersShared;
    chat_shared?: ChatShared;
    connected_website?: string;
    write_access_allowed?: WriteAccessAllowed;
    passport_data?: PassportData;
    proximity_alert_triggered?: ProximityAlertTriggered;
    boost_added?: ChatBoostAdded;
    chat_background_set?: ChatBackground;
    forum_topic_created?: ForumTopicCreated;
    forum_topic_edited?: ForumTopicEdited;
    forum_topic_closed?: ForumTopicClosed;
    forum_topic_reopened?: ForumTopicReopened;
    general_forum_topic_hidden?: GeneralForumTopicHidden;
    general_forum_topic_unhidden?: GeneralForumTopicUnhidden;
    giveaway_created?: GiveawayCreated;
    giveaway?: Giveaway;
    giveaway_winners?: GiveawayWinners;
    giveaway_completed?: GiveawayCompleted;
    video_chat_scheduled?: VideoChatScheduled;
    video_chat_started?: VideoChatStarted;
    video_chat_ended?: VideoChatEnded;
    video_chat_participants_invited?: VideoChatParticipantsInvited;
    web_app_data?: WebAppData;
    reply_markup?: InlineKeyboardMarkup;
  }
  export interface MessageId {}
  export interface InaccessibleMessage {}
  export interface MaybeInaccessibleMessage {}
  export type MessageEntityType =
    "mention" |
    "hashtag" |
    "cashtag" |
    "bot_command" |
    "url" |
    "email" |
    "phone_number" |
    "bold" |
    "italic" |
    "underline" |
    "strikethrough" |
    "spoiler" |
    "blockquote" |
    "expandable_blockquote" |
    "code" |
    "pre" |
    "text_link" |
    "text_mention" |
    "custom_emoji";
  export type MessageEntity = ({
    offset: number;
    length: number;
  }) & ({
    type: "text_link";
    url: string;
  } | {
    type: "text_mention";
    user: User;
  } | {
    type: "pre";
    language: string; // Programming language
  } | {
    type: "custom_emoji";
    custom_emoji_id: string;
  } | {
    type: 
      "mention" |
      "hashtag" |
      "cashtag" |
      "bot_command" |
      "url" |
      "email" |
      "phone_number" |
      "bold" |
      "italic" |
      "underline" |
      "strikethrough" |
      "spoiler" |
      "blockquote" |
      "expandable_blockquote" |
      "code";
  });
  export interface TextQuote {}
  export interface ExternalReplyInfo {}
  export interface ReplyParameters {
    message_id: number;
    chat_id?: number | `@${string}`;
    allow_sending_without_reply?: boolean;
    quote?: string;
    quote_parse_mode?: ParseMode;
    quote_entities?: MessageEntity[];
    quote_position?: number;
  }
  export interface MessageOrigin {}
  export interface MessageOriginUser {}
  export interface MessageOriginHiddenUser {}
  export interface MessageOriginChat {}
  export interface MessageOriginChannel {}
  export interface PhotoSize {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }
  export interface Animation {}
  export interface Audio {}
  export interface Document {}
  export interface Story {}
  export interface Video {}
  export interface VideoNote {}
  export interface Voice {}
  export interface PaidMediaInfo {}
  export interface PaidMedia {}
  export interface PaidMediaPreview {}
  export interface PaidMediaPhoto {}
  export interface PaidMediaVideo {}
  export interface Contact {}
  export interface Dice {}
  export interface PollOption {}
  export interface InputPollOption {}
  export interface PollAnswer {}
  export interface Poll {}
  export interface Location {}
  export interface Venue {}
  export interface WebAppData {}
  export interface ProximityAlertTriggered {}
  export interface MessageAutoDeleteTimerChanged {}
  export interface ChatBoostAdded {}
  export interface BackgroundFill {}
  export interface BackgroundFillSolid {}
  export interface BackgroundFillGradient {}
  export interface BackgroundFillFreeformGradient {}
  export interface BackgroundType {}
  export interface BackgroundTypeFill {}
  export interface BackgroundTypeWallpaper {}
  export interface BackgroundTypePattern {}
  export interface BackgroundTypeChatTheme {}
  export interface ChatBackground {}
  export interface ForumTopicCreated {}
  export interface ForumTopicClosed {}
  export interface ForumTopicEdited {}
  export interface ForumTopicReopened {}
  export interface GeneralForumTopicHidden {}
  export interface GeneralForumTopicUnhidden {}
  export interface SharedUser {}
  export interface UsersShared {}
  export interface ChatShared {}
  export interface WriteAccessAllowed {}
  export interface VideoChatScheduled {}
  export interface VideoChatStarted {}
  export interface VideoChatEnded {}
  export interface VideoChatParticipantsInvited {}
  export interface GiveawayCreated {}
  export interface Giveaway {}
  export interface GiveawayWinners {}
  export interface GiveawayCompleted {}
  export interface LinkPreviewOptions {}
  export interface UserProfilePhotos {}
  export interface File {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
  }
  export interface WebAppInfo {}
  export interface ReplyKeyboardMarkup {}
  export interface KeyboardButton {}
  export interface KeyboardButtonRequestUsers {}
  export interface KeyboardButtonRequestChat {}
  export interface KeyboardButtonPollType {}
  export interface ReplyKeyboardRemove {}
  export interface InlineKeyboardMarkup {}
  export interface InlineKeyboardButton {}
  export interface LoginUrl {}
  export interface SwitchInlineQueryChosenChat {}
  export interface CallbackQuery {}
  export interface ForceReply {}
  export interface ChatPhoto {}
  export interface ChatInviteLink {}
  export interface ChatAdministratorRights {}
  export interface ChatMemberUpdated {}
  export interface ChatMember {}
  export interface ChatMemberOwner {}
  export interface ChatMemberAdministrator {}
  export interface ChatMemberMember {}
  export interface ChatMemberRestricted {}
  export interface ChatMemberLeft {}
  export interface ChatMemberBanned {}
  export interface ChatJoinRequest {}
  export interface ChatPermissions {}
  export interface Birthdate {}
  export interface BusinessIntro {}
  export interface BusinessLocation {}
  export interface BusinessOpeningHoursInterval {}
  export interface BusinessOpeningHours {}
  export interface ChatLocation {}
  export interface ReactionType {}
  export interface ReactionTypeEmoji {}
  export interface ReactionTypeCustomEmoji {}
  export interface ReactionTypePaid {}
  export interface ReactionCount {}
  export interface MessageReactionUpdated {}
  export interface MessageReactionCountUpdated {}
  export interface ForumTopic {}
  export interface BotCommand {}
  export interface BotCommandScopeDefault {}
  export interface BotCommandScopeAllPrivateChats {}
  export interface BotCommandScopeAllGroupChats {}
  export interface BotCommandScopeAllChatAdministrators {}
  export interface BotCommandScopeChat {}
  export interface BotCommandScopeChatAdministrators {}
  export interface BotCommandScopeChatMember {}
  export type BotCommandScope =
    BotCommandScopeDefault |
    BotCommandScopeAllPrivateChats |
    BotCommandScopeAllGroupChats |
    BotCommandScopeAllChatAdministrators |
    BotCommandScopeChat |
    BotCommandScopeChatAdministrators |
    BotCommandScopeChatMember;
  export interface BotName {}
  export interface BotDescription {}
  export interface BotShortDescription {}
  export interface MenuButton {}
  export interface MenuButtonCommands {}
  export interface MenuButtonWebApp {}
  export interface MenuButtonDefault {}
  export interface ChatBoostSource {}
  export interface ChatBoostSourcePremium {}
  export interface ChatBoostSourceGiftCode {}
  export interface ChatBoostSourceGiveaway {}
  export interface ChatBoost {}
  export interface ChatBoostUpdated {}
  export interface ChatBoostRemoved {}
  export interface UserChatBoosts {}
  export interface BusinessConnection {}
  export interface BusinessMessagesDeleted {}
  export interface ResponseParameters {
    migrate_to_chat_id?: number;
    retry_after?: number;
  }
  export interface InputMedia {}
  export interface InputMediaPhoto {}
  export interface InputMediaVideo {}
  export interface InputMediaAnimation {}
  export interface InputMediaAudio {}
  export interface InputMediaDocument {}
  export interface InputFile {}
  export interface InputPaidMedia {}
  export interface InputPaidMediaPhoto {}
  export interface InputPaidMediaVideo {}
  
  export interface Sticker {}
  export interface StickerSet {}
  export interface MaskPosition {}
  export interface InputSticker {}
  
  export interface InlineQuery {}
  export interface InlineQueryResultsButton {}
  export interface InlineQueryResultArticle {}
  export interface InlineQueryResultPhoto {}
  export interface InlineQueryResultGif {}
  export interface InlineQueryResultMpeg4Gif {}
  export interface InlineQueryResultVideo {}
  export interface InlineQueryResultAudio {}
  export interface InlineQueryResultVoice {}
  export interface InlineQueryResultDocument {}
  export interface InlineQueryResultLocation {}
  export interface InlineQueryResultVenue {}
  export interface InlineQueryResultContact {}
  export interface InlineQueryResultGame {}
  export interface InlineQueryResultCachedPhoto {}
  export interface InlineQueryResultCachedGif {}
  export interface InlineQueryResultCachedMpeg4Gif {}
  export interface InlineQueryResultCachedSticker {}
  export interface InlineQueryResultCachedDocument {}
  export interface InlineQueryResultCachedVideo {}
  export interface InlineQueryResultCachedVoice {}
  export interface InlineQueryResultCachedAudio {}
  export type InlineQueryResult =
    InlineQueryResultsButton |
    InlineQueryResultArticle |
    InlineQueryResultPhoto |
    InlineQueryResultGif |
    InlineQueryResultMpeg4Gif |
    InlineQueryResultVideo |
    InlineQueryResultAudio |
    InlineQueryResultVoice |
    InlineQueryResultDocument |
    InlineQueryResultLocation |
    InlineQueryResultVenue |
    InlineQueryResultContact |
    InlineQueryResultGame |
    InlineQueryResultCachedPhoto |
    InlineQueryResultCachedGif |
    InlineQueryResultCachedMpeg4Gif |
    InlineQueryResultCachedSticker |
    InlineQueryResultCachedDocument |
    InlineQueryResultCachedVideo |
    InlineQueryResultCachedVoice |
    InlineQueryResultCachedAudio;
  export interface InputMessageContent {}
  export interface InputTextMessageContent {}
  export interface InputLocationMessageContent {}
  export interface InputVenueMessageContent {}
  export interface InputContactMessageContent {}
  export interface InputInvoiceMessageContent {}
  export interface ChosenInlineResult {}
  export interface SentWebAppMessage {}
  
  export interface LabeledPrice {}
  export interface Invoice {}
  export interface ShippingAddress {}
  export interface OrderInfo {}
  export interface ShippingOption {}
  export interface SuccessfulPayment {}
  export interface RefundedPayment {}
  export interface ShippingQuery {}
  export interface PreCheckoutQuery {}
  export interface PaidMediaPurchased {}
  export interface RevenueWithdrawalState {}
  export interface RevenueWithdrawalStatePending {}
  export interface RevenueWithdrawalStateSucceeded {}
  export interface RevenueWithdrawalStateFailed {}
  export interface TransactionPartner {}
  export interface TransactionPartnerUser {}
  export interface TransactionPartnerFragment {}
  export interface TransactionPartnerTelegramAds {}
  export interface TransactionPartnerOther {}
  export interface StarTransaction {}
  export interface StarTransactions {}
  
  export interface PassportData {}
  export interface PassportFile {}
  export interface EncryptedPassportElement {}
  export interface EncryptedCredentials {}
  export interface PassportElementErrorDataField {}
  export interface PassportElementErrorFrontSide {}
  export interface PassportElementErrorReverseSide {}
  export interface PassportElementErrorSelfie {}
  export interface PassportElementErrorFile {}
  export interface PassportElementErrorFiles {}
  export interface PassportElementErrorTranslationFile {}
  export interface PassportElementErrorTranslationFiles {}
  export interface PassportElementErrorUnspecified {}
  export type PassportElementError =
    PassportElementErrorDataField |
    PassportElementErrorFrontSide |
    PassportElementErrorReverseSide |
    PassportElementErrorSelfie |
    PassportElementErrorFile |
    PassportElementErrorFiles |
    PassportElementErrorTranslationFile |
    PassportElementErrorTranslationFiles |
    PassportElementErrorUnspecified;
  
  export interface Game {}
  export interface CallbackGame {}
  export interface GameHighScore {}
  
  export type UpdateTypes =
    "message" |
    "edited_message" |
    "channel_post" |
    "edited_channel_post" |
    "business_connection" |
    "business_message" |
    "edited_business_message" |
    "deleted_business_messages" |
    "message_reaction" |
    "message_reaction_count" |
    "inline_query" |
    "chosen_inline_result" |
    "callback_query" |
    "shipping_query" |
    "pre_checkout_query" |
    "purchased_paid_media" |
    "poll" |
    "poll_answer" |
    "my_chat_member" |
    "chat_member" |
    "chat_join_request" |
    "chat_boost" |
    "removed_chat_boost";
  
  export type UpdateValueTypes =
    Message |
    BusinessConnection |
    BusinessMessagesDeleted |
    MessageReactionUpdated |
    MessageReactionCountUpdated |
    InlineQuery |
    ChosenInlineResult |
    CallbackQuery |
    ShippingQuery |
    PreCheckoutQuery |
    PaidMediaPurchased |
    Poll |
    PollAnswer |
    ChatMemberUpdated |
    ChatJoinRequest |
    ChatBoostUpdated |
    ChatBoostRemoved;
  
  export interface Update {
    update_id: number;
    message?: Message;
    edited_message?: Message;
    channel_post?: Message;
    edited_channel_post?: Message;
    business_connection?: BusinessConnection;
    business_message?: Message;
    edited_business_message?: Message;
    deleted_business_messages?: BusinessMessagesDeleted;
    message_reaction?: MessageReactionUpdated;
    message_reaction_count?: MessageReactionCountUpdated;
    inline_query?: InlineQuery;
    chosen_inline_result?: ChosenInlineResult;
    callback_query?: CallbackQuery;
    shipping_query?: ShippingQuery;
    pre_checkout_query?: PreCheckoutQuery;
    purchased_paid_media?: PaidMediaPurchased;
    poll?: Poll;
    poll_answer?: PollAnswer;
    my_chat_member?: ChatMemberUpdated;
    chat_member?: ChatMemberUpdated;
    chat_join_request?: ChatJoinRequest;
    chat_boost?: ChatBoostUpdated;
    removed_chat_boost?: ChatBoostRemoved;
  }
  
  export type Response = {
    ok: true;
    result: any;
  } | {
    ok: false;
    error_code: number;
    description?: string;
    parameters?: ResponseParameters;
  }
  
} // namespace raw

export default raw;
