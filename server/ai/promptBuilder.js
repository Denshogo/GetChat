import { buildResponseSchema } from "./schemas.js";

function stringifyContextBlock(context) {
  return JSON.stringify(context, null, 2);
}

export class PromptBuilder {
  buildCommonPrompt() {
    return [
      "あなたは司法書士試験の学習支援AIです。",
      "回答は試験合格に直結する情報のみに絞り、冗長な説明は省いてください。",
      "実際の法律相談・個別事案の断定回答には対応せず、学習論点へ一般化して答えてください。",
      "返答は必ず指定JSON Schemaに一致するJSONオブジェクトのみを返してください。",
      "suggested_task_cards は復習価値が高い場合のみ、最大1件返してください。",
    ].join("\n");
  }

  buildExplainPrompt(payload) {
    return [
      "[mode: explain]",
      "司法書士試験の学習に直結する形で、以下の構成で簡潔に答えてください。",
      "conclusion: 1〜2文の核心的な結論（試験で問われる要点のみ）。",
      "explanation: 以下3点を各1行の箇条書きで記述。①条文・要件の骨格 ②試験頻出ポイント ③注意点・例外。",
      "各行は「①」「②」「③」で始め、全体で150字以内を目標にしてください。",
      "keywords: 試験対策上の検索キーワードを2〜3個。",
      `subject: ${payload.subject ?? "未指定"}`,
    ].join("\n");
  }

  buildQuizPrompt(payload) {
    return [
      "[mode: quiz]",
      "司法書士試験を想定した確認問題セットを返してください。",
      "choices 配列で統一し、reference は必須です。",
      "問題数は初期版として1問に絞って構いません。",
      "暗記だけでなく要件整理が確認できる出題を優先してください。",
      `subject: ${payload.subject ?? "未指定"}`,
    ].join("\n");
  }

  buildGradingPrompt(payload) {
    return [
      "[mode: grading]",
      "active_quiz_data の正答を基準に厳密に採点してください。",
      "表記ゆれはできるだけ解釈してください。",
      "feedback_comment は1〜2文で、不正解論点の復習ポイントのみ端的に伝えてください。",
      "explanation は正誤の根拠（条文・判例）を1文で示してください。",
      "suggested_task_cards は不正解論点のみ、最大1件にしてください。",
      `subject: ${payload.subject ?? "未指定"}`,
    ].join("\n");
  }

  buildFreePrompt(payload) {
    return [
      "[mode: free]",
      "学習支援の文脈で簡潔に回答してください。reply_text は3文以内。",
      "実際の法律相談には踏み込まず、学習論点へ一般化して誘導してください。",
      "次に取り組むべきアクションがあれば suggested_action で提案してください。",
      `subject: ${payload.subject ?? "未指定"}`,
    ].join("\n");
  }

  buildRuntimeContext(payload) {
    return {
      mode: payload.mode,
      subject: payload.subject ?? null,
      user_message: payload.user_message,
      active_quiz_data: payload.active_quiz_data ?? null,
    };
  }

  buildModePrompt(payload) {
    switch (payload.mode) {
      case "explain":
        return this.buildExplainPrompt(payload);
      case "quiz":
        return this.buildQuizPrompt(payload);
      case "grading":
        return this.buildGradingPrompt(payload);
      case "free":
        return this.buildFreePrompt(payload);
      default:
        throw new Error(`Unsupported mode for prompt building: ${payload.mode}`);
    }
  }

  buildSystemPrompt(payload) {
    return [
      this.buildCommonPrompt(),
      this.buildModePrompt(payload),
      "[runtime_context]",
      stringifyContextBlock(this.buildRuntimeContext(payload)),
    ].join("\n\n");
  }

  buildResponseSchema(mode) {
    return buildResponseSchema(mode);
  }
}
