import { LlmClient } from "./llmClient.js";
import { FREE_ACTIONS } from "./types.js";

function toStringList(value, maxItems = 2) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))]
    .slice(0, maxItems);
}

function ensureExplainResponse(raw) {
  return {
    keywords: toStringList(raw.keywords, 3),
    conclusion: String(raw.conclusion ?? ""),
    explanation: String(raw.explanation ?? ""),
    suggested_task_cards: toStringList(raw.suggested_task_cards, 2),
  };
}

function ensureQuizResponse(raw) {
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  if (questions.length === 0) {
    throw new Error("quiz response requires at least one question");
  }

  return {
    quiz_set_title: String(raw.quiz_set_title ?? "確認問題"),
    subject: raw.subject == null ? null : String(raw.subject),
    topic: raw.topic == null ? null : String(raw.topic),
    questions: questions.map((question, index) => {
      const choices = Array.isArray(question.choices) ? question.choices : [];
      if (choices.length < 2) {
        throw new Error(`quiz question ${index + 1} requires at least two choices`);
      }

      return {
        question_number: Number(question.question_number ?? index + 1),
        question_type: String(question.question_type ?? "multiple_choice"),
        difficulty: Number(question.difficulty ?? 1),
        question_text: String(question.question_text ?? ""),
        choices: choices.map((choice, choiceIndex) => ({
          choice_id: String(choice.choice_id ?? String.fromCharCode(65 + choiceIndex)),
          text: String(choice.text ?? ""),
        })),
        correct_choice_id: String(question.correct_choice_id ?? choices[0].choice_id ?? "A"),
        reference: String(question.reference ?? "基本条文"),
        explanation: String(question.explanation ?? ""),
      };
    }),
  };
}

function ensureGradingResponse(raw) {
  const results = Array.isArray(raw.results) ? raw.results : [];
  if (results.length === 0) {
    throw new Error("grading response requires at least one result");
  }

  const questionCount = Number(raw.question_count ?? results.length);
  const correctCount = Number(raw.correct_count ?? results.filter((result) => result.is_correct).length);

  return {
    results: results.map((result, index) => ({
      question_number: Number(result.question_number ?? index + 1),
      user_choice_id: result.user_choice_id == null ? null : String(result.user_choice_id),
      correct_choice_id: String(result.correct_choice_id ?? ""),
      is_correct: Boolean(result.is_correct),
      explanation: String(result.explanation ?? ""),
    })),
    correct_count: correctCount,
    question_count: questionCount,
    score_text: String(raw.score_text ?? `${correctCount}/${questionCount}`),
    feedback_comment: String(raw.feedback_comment ?? "復習ポイントを確認してください。"),
    suggested_task_cards: toStringList(raw.suggested_task_cards, 2),
  };
}

function ensureFreeResponse(raw) {
  const suggestedAction = FREE_ACTIONS.includes(raw.suggested_action) ? raw.suggested_action : "NONE";
  return {
    reply_text: String(raw.reply_text ?? "チャットから学習を始めましょう。"),
    suggested_action: suggestedAction,
    suggested_action_topic: raw.suggested_action_topic == null ? null : String(raw.suggested_action_topic),
    suggested_action_label: raw.suggested_action_label == null ? null : String(raw.suggested_action_label),
    suggested_task_cards: toStringList(raw.suggested_task_cards, 2),
  };
}

function normalizeResponse(mode, raw) {
  switch (mode) {
    case "explain":
      return ensureExplainResponse(raw);
    case "quiz":
      return ensureQuizResponse(raw);
    case "grading":
      return ensureGradingResponse(raw);
    case "free":
      return ensureFreeResponse(raw);
    default:
      throw new Error(`Unsupported mode in response normalization: ${mode}`);
  }
}

export class AiService {
  constructor({ llmClient } = {}) {
    this.llmClient = llmClient ?? new LlmClient();
  }

  getProviderName() {
    return this.llmClient.getProviderName();
  }

  async execute(payload) {
    const raw = await this.llmClient.generate(payload);
    return normalizeResponse(payload.mode, raw);
  }
}
