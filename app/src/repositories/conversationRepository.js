import { DEFAULT_SUBJECT, STORAGE_KEYS } from "../constants.js";
import { loadJson, saveJson } from "../storage.js";
import { createId } from "../utils.js";

const DEFAULT_STATE = {
  active_conversation_id: null,
  conversations: [],
};

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => {
    const left = a.updated_at ?? a.created_at ?? "";
    const right = b.updated_at ?? b.created_at ?? "";
    return left < right ? 1 : -1;
  });
}

function createConversationRecord() {
  const now = new Date().toISOString();
  return {
    conversation_id: createId("conversation"),
    title: "新しいチャット",
    created_at: now,
    updated_at: now,
    messages: [],
    active_quiz_set: null,
    selected_mode: null,
    selected_subject: DEFAULT_SUBJECT,
  };
}

function normalizeConversation(conversation) {
  if (!conversation) {
    return null;
  }

  return {
    conversation_id: conversation.conversation_id ?? createId("conversation"),
    title: conversation.title ?? "新しいチャット",
    created_at: conversation.created_at ?? new Date().toISOString(),
    updated_at: conversation.updated_at ?? conversation.created_at ?? new Date().toISOString(),
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    active_quiz_set: conversation.active_quiz_set ?? null,
    selected_mode: conversation.selected_mode ?? null,
    selected_subject: conversation.selected_subject ?? DEFAULT_SUBJECT,
  };
}

export class ConversationRepository {
  getState() {
    const raw = loadJson(STORAGE_KEYS.CONVERSATIONS, DEFAULT_STATE);
    return {
      active_conversation_id: raw.active_conversation_id ?? null,
      conversations: sortConversations((raw.conversations ?? []).map(normalizeConversation).filter(Boolean)),
    };
  }

  saveState(state) {
    saveJson(STORAGE_KEYS.CONVERSATIONS, {
      active_conversation_id: state.active_conversation_id,
      conversations: sortConversations(state.conversations),
    });
  }

  ensureInitialized() {
    const state = this.getState();
    if (state.conversations.length === 0) {
      const conversation = createConversationRecord();
      const next = {
        active_conversation_id: conversation.conversation_id,
        conversations: [conversation],
      };
      this.saveState(next);
      return {
        conversations: next.conversations,
        activeConversation: conversation,
      };
    }

    const activeConversation = state.conversations.find(
      (conversation) => conversation.conversation_id === state.active_conversation_id,
    ) ?? state.conversations[0];

    if (state.active_conversation_id !== activeConversation.conversation_id) {
      this.saveState({
        ...state,
        active_conversation_id: activeConversation.conversation_id,
      });
    }

    return {
      conversations: state.conversations,
      activeConversation,
    };
  }

  createConversation() {
    const state = this.getState();
    const conversation = createConversationRecord();
    const next = {
      active_conversation_id: conversation.conversation_id,
      conversations: [conversation, ...state.conversations],
    };
    this.saveState(next);
    return {
      conversations: sortConversations(next.conversations),
      activeConversation: conversation,
    };
  }

  setActiveConversation(conversationId) {
    const state = this.getState();
    const activeConversation = state.conversations.find(
      (conversation) => conversation.conversation_id === conversationId,
    ) ?? null;

    if (!activeConversation) {
      return null;
    }

    this.saveState({
      ...state,
      active_conversation_id: activeConversation.conversation_id,
    });

    return activeConversation;
  }

  saveConversation(conversation) {
    const normalized = normalizeConversation(conversation);
    const state = this.getState();
    const conversations = state.conversations.filter(
      (item) => item.conversation_id !== normalized.conversation_id,
    );

    const next = {
      active_conversation_id: normalized.conversation_id,
      conversations: [normalized, ...conversations],
    };
    this.saveState(next);
    return sortConversations(next.conversations);
  }

  findById(conversationId) {
    return this.getState().conversations.find(
      (conversation) => conversation.conversation_id === conversationId,
    ) ?? null;
  }
}
