import { CHAT_SUGGESTIONS } from "../../constants.js";

export function createSuggestionActions(topic) {
  const actions = document.createElement("div");
  actions.className = "message-actions";

  const addTaskButton = document.createElement("button");
  addTaskButton.type = "button";
  addTaskButton.className = "inline-action";
  addTaskButton.dataset.action = "add-task";
  addTaskButton.dataset.topic = topic;
  addTaskButton.textContent = CHAT_SUGGESTIONS.ADD_TASK;

  const relatedQuizButton = document.createElement("button");
  relatedQuizButton.type = "button";
  relatedQuizButton.className = "inline-action";
  relatedQuizButton.dataset.action = "related-quiz";
  relatedQuizButton.dataset.topic = topic;
  relatedQuizButton.textContent = CHAT_SUGGESTIONS.RELATED_QUIZ;

  actions.appendChild(addTaskButton);
  actions.appendChild(relatedQuizButton);

  return actions;
}
