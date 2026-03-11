import { buildResponseSchema } from "./schemas.js";

function stringifyContextBlock(context) {
  return JSON.stringify(context, null, 2);
}

export class PromptBuilder {
  buildCommonPrompt() {
    return [
      "あなたは司法書士試験の学習支援AIです。",
      "学習目的を最優先し、冗長な回答を避けてください。",
      "必要に応じてテキスト復習へ誘導してください。",
      "実際の法律相談・個別事案の断定回答には対応せず、学習論点へ一般化して答えてください。",
      "返答は必ず指定JSON Schemaに一致するJSONオブジェクトのみを返してください。",
      "suggested_task_cards は最大2件、できれば1件に抑えてください。",
    ].join("\n");
  }

  buildExplainPrompt(payload) {
    return [
      "[mode: explain]",
      "疑問論点を簡潔かつ正確に説明してください。",
      "keywords は検索用キーワードを2〜3個に絞ってください。",
      "conclusion は最初に示す短い結論、explanation は簡潔な理由説明にしてください。",
      "復習価値が高いときだけ suggested_task_cards を返してください。",
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
      "feedback_comment では次に復習すべき観点を短く伝えてください。",
      "suggested_task_cards は不正解論点中心で最大2件にしてください。",
      `subject: ${payload.subject ?? "未指定"}`,
    ].join("\n");
  }

  buildFreePrompt(payload) {
    return [
      "[mode: free]",
      "自由記述に応答しつつ、学習支援の軸を維持してください。",
      "必要なら suggested_action で次アクションを提案してください。",
      "実際の法律相談には踏み込まず、学習論点へ一般化して誘導してください。",
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
