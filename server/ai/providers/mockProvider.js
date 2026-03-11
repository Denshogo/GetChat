import { QuizService } from "../../../app/src/services/quizService.js";
import { normalizeTopic } from "../../../app/src/utils.js";
import { getDefaultKeywordsForSubject, getSubjectProfile } from "../../../app/src/services/subjectProfiles.js";

const quizService = new QuizService();

const LEGAL_KEYWORD_MAP = [
  {
    trigger: /表見代理|民法109|民法110|民法112/,
    keywords: ["表見代理", "代理権授与表示", "民法109条"],
    conclusion: "表見代理は、外観作出と相手方保護要件を分けて確認すると整理しやすい論点です。",
    explanation: "本人関与による外観と、相手方の善意無過失の有無が中心です。条文類型ごとに成立要件を切り分けてください。",
    topic: "表見代理",
  },
  {
    trigger: /代理|無権代理|民法117/,
    keywords: ["無権代理", "民法117条", "追認"],
    conclusion: "無権代理は、本人の追認の有無と無権代理人責任を切り分けると理解が安定します。",
    explanation: "まず効果帰属の有無を確認し、その後に民法117条の責任要件へ進むと混線を防げます。",
    topic: "無権代理",
  },
  {
    trigger: /登記|民法177|対抗要件/,
    keywords: ["登記", "対抗要件", "民法177条"],
    conclusion: "登記論点は、当事者間の効力と第三者対抗を分けるのが基本です。",
    explanation: "誰に対して登記が必要かを先に切り分けると、択一の誤答を減らせます。",
    topic: "登記と対抗要件",
  },
];

const REFERENCE_MAP = {
  "代理": "民法99条",
  "無権代理": "民法113条1項",
  "代理・無権代理": "民法113条1項",
  "表見代理": "民法109条",
  "登記申請情報": "不動産登記法18条",
  "登記と対抗要件": "民法177条",
  "取締役会": "会社法362条",
  "既判力": "民事訴訟法114条",
  "人権制約": "憲法13条",
  "故意": "刑法38条",
};

function clampTaskCards(items) {
  return [...new Set(items.filter(Boolean).map((item) => item.trim()))].slice(0, 2);
}

function inferExplainBase(text, subject) {
  const normalized = normalizeTopic(text || "");
  for (const rule of LEGAL_KEYWORD_MAP) {
    if (rule.trigger.test(normalized)) {
      return rule;
    }
  }

  const topic = normalized.split(/[\s　、,。]/).find(Boolean) ?? "主要論点";
  const profile = getSubjectProfile(subject);

  return {
    keywords: getDefaultKeywordsForSubject(subject, topic),
    conclusion: `${topic}は、条文と要件を順に確認すると理解しやすい論点です。`,
    explanation: `${profile.focus}観点で整理し、${profile.reviewHint}すると定着しやすくなります。`,
    topic,
  };
}

function inferTopicFromText(text) {
  return normalizeTopic(text || "").split(/[\n\r。！？!?\s　、,]/).find(Boolean) ?? "主要論点";
}

function inferReference(subject, topic) {
  return REFERENCE_MAP[topic] ?? (subject === "不動産登記法" ? "不動産登記法1条" : `${subject} 基本条文`);
}

function inferQuestionType(choices) {
  if (choices.length === 2 && choices.every((choice) => choice.text === "○" || choice.text === "×")) {
    return "ox";
  }
  return "multiple_choice";
}

function extractChoiceId(question, rawText) {
  if (!rawText) {
    return null;
  }

  const trimmed = rawText.trim();
  const normalized = trimmed.toUpperCase();
  const direct = question.choices.find((choice) => choice.choice_id.toUpperCase() === normalized);
  if (direct) {
    return direct.choice_id;
  }

  const digitMatch = trimmed.match(/([1-9１-９])/);
  if (digitMatch) {
    const rawNumber = digitMatch[1].replace(/[１-９]/g, (value) => String(value.charCodeAt(0) - 65296));
    const index = Number(rawNumber) - 1;
    if (question.choices[index]) {
      return question.choices[index].choice_id;
    }
  }

  const textMatched = question.choices.find((choice) => trimmed.includes(choice.text));
  return textMatched?.choice_id ?? null;
}

export class MockLlmProvider {
  constructor() {
    this.providerName = "mock";
  }

  async generate({ payload }) {
    switch (payload.mode) {
      case "explain": {
        const base = inferExplainBase(payload.user_message, payload.subject);
        return {
          keywords: base.keywords,
          conclusion: base.conclusion,
          explanation: base.explanation,
          suggested_task_cards: clampTaskCards([`${base.topic} 要件整理`]),
        };
      }
      case "quiz": {
        const topic = inferTopicFromText(payload.user_message);
        const quiz = /ランダム|おまかせ|random/i.test(payload.user_message)
          ? quizService.generateRandomQuiz({ subject: payload.subject })
          : quizService.generateQuiz({
            subject: payload.subject,
            topic,
            source: "api",
          });

        return {
          quiz_set_title: `${quiz.subject} ${quiz.topic} 確認問題`,
          subject: quiz.subject,
          topic: quiz.topic,
          questions: [
            {
              question_number: 1,
              question_type: inferQuestionType(quiz.choices),
              difficulty: 1,
              question_text: quiz.question,
              choices: quiz.choices.map((choice) => ({
                choice_id: choice.id,
                text: choice.text,
              })),
              correct_choice_id: quiz.correctChoiceId,
              reference: inferReference(quiz.subject, quiz.topic),
              explanation: quiz.explanation,
            },
          ],
        };
      }
      case "grading": {
        const quizData = payload.active_quiz_data;
        const results = quizData.questions.map((question) => {
          const userChoiceId = extractChoiceId(question, payload.user_message);
          const isCorrect = userChoiceId === question.correct_choice_id;
          return {
            question_number: question.question_number,
            user_choice_id: userChoiceId,
            correct_choice_id: question.correct_choice_id,
            is_correct: Boolean(isCorrect),
            explanation: isCorrect
              ? `正解です。${question.reference}を軸に理解できています。`
              : `${question.reference}を基準に正答を確認してください。${question.explanation}`,
          };
        });

        const correctCount = results.filter((result) => result.is_correct).length;
        const suggestedTaskCards = clampTaskCards(
          results
            .filter((result) => !result.is_correct)
            .map((result) => {
              const question = quizData.questions.find((item) => item.question_number === result.question_number);
              return question ? `${quizData.topic ?? payload.subject} ${question.reference}` : null;
            }),
        );

        return {
          results,
          correct_count: correctCount,
          question_count: results.length,
          score_text: `${correctCount}/${results.length}`,
          feedback_comment:
            correctCount === results.length
              ? "全問正解です。次は類題で同じ論点を安定させましょう。"
              : "不正解の論点を復習メモに残し、条文と要件を再確認してください。",
          suggested_task_cards: suggestedTaskCards,
        };
      }
      case "free": {
        const topic = inferTopicFromText(payload.user_message);
        const lower = payload.user_message.toLowerCase();
        const triggerQuiz = /問題|作問|出して/.test(payload.user_message);
        const triggerExplain = !triggerQuiz && (/[?？]/.test(payload.user_message) || /説明|教えて|とは/.test(payload.user_message));

        return {
          reply_text: triggerQuiz
            ? `「${topic}」で確認問題を出せます。必要ならそのまま作問に進みましょう。`
            : `「${topic}」は学習論点として整理できます。必要なら解説モードで要件から確認しましょう。`,
          suggested_action: triggerQuiz ? "TRIGGER_QUIZ" : triggerExplain || lower.length > 0 ? "TRIGGER_EXPLAIN" : "NONE",
          suggested_action_topic: triggerQuiz || triggerExplain ? topic : null,
          suggested_action_label: triggerQuiz
            ? `${topic}で問題を出す`
            : triggerExplain
              ? `${topic}を解説する`
              : null,
          suggested_task_cards: [],
        };
      }
      default:
        throw new Error(`Unsupported mode in mock provider: ${payload.mode}`);
    }
  }
}
