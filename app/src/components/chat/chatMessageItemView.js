import { createSuggestionActions } from "./suggestionActionsView.js";

export function createChatMessageItem(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${message.role}`;

  if (message.role === "user") {
    wrapper.textContent = message.content;
    return wrapper;
  }

  if ((message.keywords ?? []).length > 0) {
    const keywords = document.createElement("p");
    keywords.className = "message-keywords";
    keywords.textContent = `【検索用キーワード】${(message.keywords ?? []).join(" / ")}`;
    wrapper.appendChild(keywords);
  }

  const conclusion = document.createElement("p");
  conclusion.className = "message-block";
  conclusion.textContent = message.conclusion;
  wrapper.appendChild(conclusion);

  if (message.reason) {
    const reason = document.createElement("p");
    reason.className = "message-block message-reason";
    reason.textContent = message.reason;
    wrapper.appendChild(reason);
  }

  if (message.suggestedTaskTitle && message.canGenerateQuiz) {
    wrapper.appendChild(createSuggestionActions(message.suggestedTaskTitle));
  }

  return wrapper;
}
