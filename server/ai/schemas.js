import { assertNeverMode } from "./types.js";

const stringArray = {
  type: "array",
  items: { type: "string" },
  maxItems: 2,
};

const quizChoiceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    choice_id: { type: "string" },
    text: { type: "string" },
  },
  required: ["choice_id", "text"],
};

const quizQuestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    question_number: { type: "integer" },
    question_type: { type: "string" },
    difficulty: { type: "integer" },
    question_text: { type: "string" },
    choices: {
      type: "array",
      items: quizChoiceSchema,
      minItems: 2,
    },
    correct_choice_id: { type: "string" },
    reference: { type: "string" },
    explanation: { type: "string" },
  },
  required: [
    "question_number",
    "question_type",
    "difficulty",
    "question_text",
    "choices",
    "correct_choice_id",
    "reference",
    "explanation",
  ],
};

export function buildResponseSchema(mode) {
  switch (mode) {
    case "explain":
      return {
        name: "explain_response",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            keywords: stringArray,
            conclusion: { type: "string" },
            explanation: { type: "string" },
            suggested_task_cards: stringArray,
          },
          required: ["keywords", "conclusion", "explanation", "suggested_task_cards"],
        },
      };
    case "quiz":
      return {
        name: "quiz_response",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            quiz_set_title: { type: "string" },
            subject: { type: ["string", "null"] },
            topic: { type: ["string", "null"] },
            questions: {
              type: "array",
              items: quizQuestionSchema,
              minItems: 1,
            },
          },
          required: ["quiz_set_title", "subject", "topic", "questions"],
        },
      };
    case "grading":
      return {
        name: "grading_response",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  question_number: { type: "integer" },
                  user_choice_id: { type: ["string", "null"] },
                  correct_choice_id: { type: "string" },
                  is_correct: { type: "boolean" },
                  explanation: { type: "string" },
                },
                required: [
                  "question_number",
                  "user_choice_id",
                  "correct_choice_id",
                  "is_correct",
                  "explanation",
                ],
              },
              minItems: 1,
            },
            correct_count: { type: "integer" },
            question_count: { type: "integer" },
            score_text: { type: "string" },
            feedback_comment: { type: "string" },
            suggested_task_cards: stringArray,
          },
          required: [
            "results",
            "correct_count",
            "question_count",
            "score_text",
            "feedback_comment",
            "suggested_task_cards",
          ],
        },
      };
    case "free":
      return {
        name: "free_response",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply_text: { type: "string" },
            suggested_action: { type: "string", enum: ["TRIGGER_QUIZ", "TRIGGER_EXPLAIN", "NONE"] },
            suggested_action_topic: { type: ["string", "null"] },
            suggested_action_label: { type: ["string", "null"] },
            suggested_task_cards: stringArray,
          },
          required: [
            "reply_text",
            "suggested_action",
            "suggested_action_topic",
            "suggested_action_label",
            "suggested_task_cards",
          ],
        },
      };
    default:
      return assertNeverMode(mode);
  }
}
