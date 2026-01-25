export type ChatMessage = {
  id: number;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
};

export type ParentToWidgetMessage =
  | { type: "TERAO_NAVI_STATE"; payload: { messages: ChatMessage[]; isTyping: boolean } }
  | { type: "TERAO_NAVI_SET_TYPING"; payload: { isTyping: boolean } }
  | { type: "TERAO_NAVI_APPEND_MESSAGE"; payload: { message: ChatMessage } }
  | { type: "TERAO_NAVI_SET_MESSAGES"; payload: { messages: ChatMessage[] } };

export type WidgetToParentMessage =
  | { type: "TERAO_NAVI_READY" }
  | { type: "TERAO_NAVI_USER_SEND"; payload: { text: string } }
  | { type: "TERAO_NAVI_CLEAR" }
  | { type: "TERAO_NAVI_MINIMIZE" };
