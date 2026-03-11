import { detectIntent } from "../../services/intentService.js";
import { normalizeTopic } from "../../utils.js";
import {
  answerSessionFromText,
  canAcceptGradingInput,
  canCreateNewQuizSet,
} from "../quiz/sessionService.js";

export class ChatFeatureService {
  constructor({ aiClient }) {
    this.aiClient = aiClient;
  }

  async handleUserInput({
    text,
    selectedSubject,
    selectedMode,
    activeQuizSession,
  }) {
    if (selectedMode === "quiz") {
      if (!canCreateNewQuizSet(activeQuizSession)) {
        return {
          type: "blocked",
          notice: "未完了の問題セットがあります。先に回答・採点を完了するか、問題を終了してください。",
        };
      }

      return this.handleQuizRequest({ text, selectedSubject });
    }

    if (selectedMode === "grading") {
      return this.handleGradingRequest({
        text,
        selectedSubject,
        activeQuizSession,
      });
    }

    if (!selectedMode) {
      const reply = await this.aiClient.free({
        text,
        subject: selectedSubject,
        activeQuizSession,
      });

      return {
        type: "answer",
        assistantReply: {
          keywords: reply.suggested_action_topic ? [reply.suggested_action_topic] : ["自由記述"],
          conclusion: reply.reply_text,
          reason: reply.suggested_action_label ?? "",
          topic: reply.suggested_action_topic ?? (normalizeTopic(text) || "主要論点"),
          suggestedTaskCards: reply.suggested_task_cards ?? [],
        },
      };
    }

    const reply = await this.aiClient.explain({
      text,
      subject: selectedSubject,
      attachments: [],
    });

    return {
      type: "answer",
      assistantReply: reply,
    };
  }

  async handleGradingRequest({ text, selectedSubject, activeQuizSession }) {
    if (!canAcceptGradingInput(activeQuizSession)) {
      return {
        type: "blocked",
        notice: "先に問題を作成してください",
      };
    }

    const answerResult = answerSessionFromText(activeQuizSession, text);
    if (!answerResult.ok) {
      if (answerResult.reason === "already_answered") {
        return {
          type: "blocked",
          notice: "回答済みです。問題カードで採点してください",
        };
      }

      return {
        type: "grading_invalid",
        assistantReply: {
          keywords: [selectedSubject, activeQuizSession.quiz.topic, "解答入力"],
          conclusion: "択一初期版のため、1〜4の番号で回答するか、問題カードで選択してください。",
          reason: "現在の問題セット1問だけを順番に処理する設計です。回答を登録したら、そのまま採点に進めます。",
          topic: activeQuizSession.quiz.topic,
        },
      };
    }

    return {
      type: "grading_answered",
      assistantReply: {
        keywords: [selectedSubject, activeQuizSession.quiz.topic, "回答登録"],
        conclusion: "現在の問題セットに回答を登録しました。",
        reason: `選択肢「${answerResult.choice?.text ?? ""}」を記録しました。問題カードで採点してください。`,
        topic: activeQuizSession.quiz.topic,
      },
      activeQuizSession,
    };
  }

  async handleQuizRequest({ text, selectedSubject }) {
    const intent = detectIntent(text);
    const fallbackTopic = normalizeTopic(text) || "主要論点";
    const topic = intent.type === "quiz_request" ? intent.topic : fallbackTopic;

    const quiz = await this.aiClient.generateQuiz({
      text: `${topic}の確認問題を1問作って`,
      subject: selectedSubject,
      source: "chat",
      taskId: null,
    });

    const launchReply = this.aiClient.buildQuizLaunchReply({
      quiz,
    });

    return {
      type: "quiz_request",
      quiz,
      assistantReply: launchReply,
    };
  }
}
