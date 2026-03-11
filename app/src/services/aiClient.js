import { toActiveQuizData } from "../features/quiz/aiPayloadAdapter.js";
import { normalizeTopic } from "../utils.js";
import { QuizService, toQuizEntityFromApiResponse } from "./quizService.js";
import { getDefaultKeywordsForSubject, getSubjectProfile } from "./subjectProfiles.js";

const quizService = new QuizService();

const LEGAL_KEYWORD_MAP = [
  {
    trigger: /表見代理|民法109|民法110|民法112/,
    keywords: ["表見代理", "代理権授与表示", "民法109条"],
    conclusion: "相手方の保護要件を満たせば、本人に効果が帰属します。",
    explanation: "外観作出への本人関与と相手方の善意無過失が中心判断軸です。",
    topic: "表見代理",
  },
  {
    trigger: /代理|無権代理|民法117/,
    keywords: ["代理", "無権代理", "民法117条"],
    conclusion: "代理権の有無と本人の追認可能性を先に切り分けるのが有効です。",
    explanation: "効果帰属の主体が変わるため、要件事実の整理が得点差になります。",
    topic: "代理・無権代理",
  },
  {
    trigger: /登記|対抗要件|民法177/,
    keywords: ["登記", "対抗要件", "民法177条"],
    conclusion: "物権変動の当事者間有効性と第三者対抗を分けて理解してください。",
    explanation: "司法書士試験では『第三者に当たるか』の射程確認が頻出です。",
    topic: "登記と対抗要件",
  },
];

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
    conclusion: `${topic}は、${profile.focus}と理解が安定します。`,
    explanation: `結論先行で条文→要件→例外の順に整理し、${profile.reviewHint}ことが有効です。`,
    topic,
  };
}

function inferTopic(text) {
  return normalizeTopic(text || "").split(/[\n\r。！？!?\s　、,]/).find(Boolean) ?? "主要論点";
}

function extractChoiceId(question, rawText) {
  if (!rawText) {
    return null;
  }

  const trimmed = rawText.trim();
  const exact = question.choices.find((choice) => choice.choice_id === trimmed || choice.choice_id === trimmed.toUpperCase());
  if (exact) {
    return exact.choice_id;
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

function buildApiRequestBody({ mode, subject, userMessage, activeQuizData }) {
  return {
    mode,
    subject: subject ?? null,
    user_message: userMessage,
    active_quiz_data: activeQuizData ?? null,
  };
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? `AI request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

function mapExplainResponse(response, { fallbackTopic, subject }) {
  const topic = response.suggested_task_cards?.[0]
    ? normalizeTopic(response.suggested_task_cards[0])
    : fallbackTopic ?? inferTopic(response.keywords?.[0] ?? subject ?? "主要論点");

  return {
    keywords: response.keywords ?? [],
    conclusion: response.conclusion,
    reason: response.explanation,
    topic,
    suggestedTaskCards: response.suggested_task_cards ?? [],
  };
}

function buildQuizLaunchReplyFromQuiz(quiz) {
  return {
    keywords: getDefaultKeywordsForSubject(quiz.subject, quiz.topic),
    conclusion: `${quiz.topic}の確認問題を表示しました。`,
    reason: `${quiz.reference ?? "条文"}を確認しながら解くと、弱点の切り分けがしやすくなります。`,
    topic: quiz.topic,
  };
}

export class ApiAiProvider {
  constructor({ endpoint = "/api/ai" } = {}) {
    this.endpoint = endpoint;
  }

  async request(body) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return parseApiResponse(response);
  }

  async explain({ text, subject }) {
    const response = await this.request(
      buildApiRequestBody({
        mode: "explain",
        subject,
        userMessage: text,
        activeQuizData: null,
      }),
    );

    return mapExplainResponse(response, {
      fallbackTopic: inferTopic(text),
      subject,
    });
  }

  async generateQuiz({ text, subject, source = "chat", taskId = null }) {
    const response = await this.request(
      buildApiRequestBody({
        mode: "quiz",
        subject,
        userMessage: text,
        activeQuizData: null,
      }),
    );

    return toQuizEntityFromApiResponse(response, { source, taskId });
  }

  async gradeQuiz({ text, subject, activeQuizSession }) {
    return this.request(
      buildApiRequestBody({
        mode: "grading",
        subject,
        userMessage: text,
        activeQuizData: toActiveQuizData(activeQuizSession),
      }),
    );
  }

  async free({ text, subject, activeQuizSession = null }) {
    return this.request(
      buildApiRequestBody({
        mode: "free",
        subject,
        userMessage: text,
        activeQuizData: activeQuizSession ? toActiveQuizData(activeQuizSession) : null,
      }),
    );
  }

  buildQuizLaunchReply(payload) {
    return buildQuizLaunchReplyFromQuiz(payload.quiz);
  }
}

export class MockAiProvider {
  async explain({ text, subject, attachments = [] }) {
    const base = inferExplainBase(text, subject);
    const attachmentHint = attachments.length > 0
      ? "画像付き質問として、図表中の事実関係と論点ラベルを分離して確認してください。"
      : "必要なら復習メモに残し、基本書の該当ページに戻ってください。";

    return {
      keywords: base.keywords,
      conclusion: base.conclusion,
      reason: `${base.explanation} ${attachmentHint}`,
      topic: base.topic,
      suggestedTaskCards: [`${base.topic} 要件整理`],
    };
  }

  async generateQuiz({ text, subject, source = "chat", taskId = null }) {
    if (/ランダム|おまかせ|random/i.test(text)) {
      return quizService.generateRandomQuiz({ subject });
    }

    const topic = inferTopic(text);
    return quizService.generateQuiz({
      subject,
      topic,
      source,
      taskId,
    });
  }

  async gradeQuiz({ text, subject, activeQuizSession }) {
    const activeQuizData = toActiveQuizData(activeQuizSession);
    const results = activeQuizData.questions.map((question) => {
      const userChoiceId = extractChoiceId(question, text);
      const isCorrect = userChoiceId === question.correct_choice_id;
      return {
        question_number: question.question_number,
        user_choice_id: userChoiceId,
        correct_choice_id: question.correct_choice_id,
        is_correct: isCorrect,
        explanation: isCorrect
          ? `正解です。${question.reference}の理解は安定しています。`
          : `${question.reference}を確認し、${question.explanation}`,
      };
    });

    const correctCount = results.filter((result) => result.is_correct).length;
    return {
      results,
      correct_count: correctCount,
      question_count: results.length,
      score_text: `${correctCount}/${results.length}`,
      feedback_comment:
        correctCount === results.length
          ? "全問正解です。類題で再確認しましょう。"
          : "不正解論点を復習メモに残し、条文と要件を見直してください。",
      suggested_task_cards: results.filter((item) => !item.is_correct).slice(0, 2).map(() => `${subject} ${activeQuizSession.topic}`),
    };
  }

  async free({ text, subject }) {
    const topic = inferTopic(text);
    return {
      reply_text: `${topic}は学習論点として整理できます。必要なら解説モードで要件を確認しましょう。`,
      suggested_action: "TRIGGER_EXPLAIN",
      suggested_action_topic: topic,
      suggested_action_label: `${topic}を解説する`,
      suggested_task_cards: [],
      subject,
    };
  }

  buildQuizLaunchReply(payload) {
    return buildQuizLaunchReplyFromQuiz(payload.quiz);
  }
}

export class AiClient {
  constructor({ provider } = {}) {
    this.provider = provider ?? this.createDefaultProvider();
  }

  createDefaultProvider() {
    if (typeof document !== "undefined" && typeof fetch === "function") {
      return new ApiAiProvider();
    }

    return new MockAiProvider();
  }

  async explain(payload) {
    return this.provider.explain(payload);
  }

  async generateQuiz(payload) {
    return this.provider.generateQuiz(payload);
  }

  async gradeQuiz(payload) {
    return this.provider.gradeQuiz(payload);
  }

  async free(payload) {
    return this.provider.free(payload);
  }

  async respond(payload) {
    return this.explain(payload);
  }

  buildQuizLaunchReply(payload) {
    return this.provider.buildQuizLaunchReply(payload);
  }
}
