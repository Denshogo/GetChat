import { createChatMessageItem } from "./chatMessageItemView.js";
import { createQuizThreadCard } from "../quiz/quizThreadCardView.js";

export function renderChatMessageList(container, messages, currentQuizSession = null) {
  container.innerHTML = "";

  messages.forEach((message) => {
    container.appendChild(createChatMessageItem(message));
  });

  if (currentQuizSession) {
    container.appendChild(createQuizThreadCard(currentQuizSession));
  }

  container.scrollTop = container.scrollHeight;
}
