import { expectError } from "tsd";
import type { Message, Chat } from ".";

declare function declval<T>(): T;

declval<Message>().reply({ text: "" });
declval<Message>().reply("");
expectError(declval<Message>().reply({}));

declval<Chat>().send({ text: "" });
declval<Chat>().send("");
declval<Chat>().send({ text: "", replyTo: declval<Message>() });
declval<Chat>().send({ text: "", replyOptions: {} });
declval<Chat>().send({ text: "", replyTo: declval<Message>(), replyOptions: undefined });
declval<Chat>().send({ text: "", replyOptions: {}, replyTo: undefined });
expectError(declval<Chat>().send({ text: "", replyTo: declval<Message>(), replyOptions: {} }));
