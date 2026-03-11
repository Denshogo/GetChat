import { normalizeTopic } from "../utils.js";

const TOPIC_PATTERNS = [
  /(.+?)の(?:確認)?(?:問題|クイズ)/,
  /(.+?)について(?:確認)?(?:問題|クイズ)/,
];

const QUIZ_WORD_PATTERN = /(問題|クイズ|腕試し)/;
const QUIZ_REQUEST_PATTERN = /(出して|作って|お願いします|ください|ほしい|解きたい|解かせ)/;

export function detectIntent(text) {
  const normalizedText = normalizeTopic(text);

  for (const pattern of TOPIC_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (!match) {
      continue;
    }

    const topicCandidate = normalizeTopic(match[1] ?? "");
    if (!topicCandidate || ["問題", "クイズ", "確認"].includes(topicCandidate)) {
      continue;
    }

    return {
      type: "quiz_request",
      topic: topicCandidate,
    };
  }

  if (QUIZ_WORD_PATTERN.test(normalizedText) && QUIZ_REQUEST_PATTERN.test(normalizedText)) {
    return {
      type: "quiz_request",
      topic: "主要論点",
    };
  }

  return {
    type: "question",
    topic: "",
  };
}
