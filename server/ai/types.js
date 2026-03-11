export const AI_MODES = ["explain", "quiz", "grading", "free"];
export const FREE_ACTIONS = ["TRIGGER_QUIZ", "TRIGGER_EXPLAIN", "NONE"];

/**
 * @typedef {"explain" | "quiz" | "grading" | "free"} AiMode
 */

/**
 * @typedef {Object} QuizChoice
 * @property {string} choice_id
 * @property {string} text
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {number} question_number
 * @property {string} question_type
 * @property {number} difficulty
 * @property {string} question_text
 * @property {QuizChoice[]} choices
 * @property {string} correct_choice_id
 * @property {string} reference
 * @property {string} explanation
 */

/**
 * @typedef {Object} ActiveQuizData
 * @property {string} quiz_set_id
 * @property {string | null} subject
 * @property {string | null} topic
 * @property {string | null} status
 * @property {QuizQuestion[]} questions
 * @property {string | null} user_answer_raw
 */

/**
 * @typedef {Object} ExplainResponse
 * @property {string[]} keywords
 * @property {string} conclusion
 * @property {string} explanation
 * @property {string[]} suggested_task_cards
 */

/**
 * @typedef {Object} QuizResponse
 * @property {string} quiz_set_title
 * @property {string | null} subject
 * @property {string | null} topic
 * @property {QuizQuestion[]} questions
 */

/**
 * @typedef {Object} GradingResultItem
 * @property {number} question_number
 * @property {string | null} user_choice_id
 * @property {string} correct_choice_id
 * @property {boolean} is_correct
 * @property {string} explanation
 */

/**
 * @typedef {Object} GradingResponse
 * @property {GradingResultItem[]} results
 * @property {number} correct_count
 * @property {number} question_count
 * @property {string} score_text
 * @property {string} feedback_comment
 * @property {string[]} suggested_task_cards
 */

/**
 * @typedef {Object} FreeResponse
 * @property {string} reply_text
 * @property {"TRIGGER_QUIZ" | "TRIGGER_EXPLAIN" | "NONE"} suggested_action
 * @property {string | null} suggested_action_topic
 * @property {string | null} suggested_action_label
 * @property {string[]} suggested_task_cards
 */

export function isValidMode(mode) {
  return AI_MODES.includes(mode);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function assertNeverMode(mode) {
  throw new Error(`Unsupported AI mode: ${mode}`);
}
