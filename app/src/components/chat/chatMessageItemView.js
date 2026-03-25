import { createSuggestionActions } from "./suggestionActionsView.js";

export function createChatMessageItem(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${message.role}`;

  if (message.role === "user") {
    wrapper.textContent = message.content ?? "";
    return wrapper;
  }

  // キーワードチップ
  const keywords = message.keywords ?? [];
  if (keywords.length > 0) {
    const keywordsRow = document.createElement("div");
    keywordsRow.className = "message-keywords-row";
    keywords.forEach((kw) => {
      const chip = document.createElement("span");
      chip.className = "message-keyword-chip";
      chip.textContent = kw;
      keywordsRow.appendChild(chip);
    });
    wrapper.appendChild(keywordsRow);
  }

  // 結論（conclusion が空なら content を使用）
  const conclusionText = message.conclusion || message.content || "";
  if (conclusionText) {
    const conclusion = document.createElement("p");
    conclusion.className = "message-conclusion";
    conclusion.textContent = conclusionText;
    wrapper.appendChild(conclusion);
  }

  // 補足説明
  const reason = message.reason ?? "";
  if (reason) {
    const divider = document.createElement("hr");
    divider.className = "message-divider";
    wrapper.appendChild(divider);

    const explanation = document.createElement("div");
    explanation.className = "message-explanation";
    reason.split("\n").forEach((line, i) => {
      if (i > 0) explanation.appendChild(document.createElement("br"));
      explanation.appendChild(document.createTextNode(line));
    });
    wrapper.appendChild(explanation);
  }

  if (message.suggestedTaskTitle && message.canGenerateQuiz) {
    wrapper.appendChild(createSuggestionActions(message.suggestedTaskTitle));
  }

  return wrapper;
}
