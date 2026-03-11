import { createId } from "../../utils.js";

export function createUserMessage(text) {
  return {
    id: createId("msg"),
    role: "user",
    content: text,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function createAssistantMessage(payload) {
  const parts = [payload.conclusion, payload.reason].filter(Boolean);
  return {
    id: createId("msg"),
    role: "assistant",
    content: parts.join("\n"),
    keywords: payload.keywords,
    conclusion: payload.conclusion,
    reason: payload.reason ?? "",
    topic: payload.topic,
    suggestedTaskTitle: payload.topic,
    canGenerateQuiz: true,
    relatedSubject: payload.relatedSubject ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function createWelcomeMessage() {
  return createAssistantMessage({
    keywords: ["学習計画", "復習メモ", "確認問題"],
    conclusion: "疑問を入力すると、要点解説と復習導線をすぐ返します。",
    reason: "曖昧な論点は復習メモに残し、確認問題で定着させる流れを一画面で回せます。",
    topic: "学習計画",
    relatedSubject: null,
  });
}
