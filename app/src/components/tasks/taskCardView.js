import { formatDateTime } from "../../utils.js";

export function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  if (task.is_completed) {
    card.classList.add("completed");
  }

  const top = document.createElement("div");
  top.className = "task-top";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.is_completed);
  checkbox.dataset.action = "toggle-task";
  checkbox.dataset.taskId = task.id;

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  top.appendChild(checkbox);
  top.appendChild(title);
  card.appendChild(top);

  const meta = document.createElement("p");
  meta.className = "task-meta";
  const completedLabel = task.is_completed && task.completed_at
    ? ` / 完了: ${formatDateTime(task.completed_at)}`
    : "";
  meta.textContent = `作成: ${formatDateTime(task.created_at)}${completedLabel}`;
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  if (task.is_completed) {
    const reviewButton = document.createElement("button");
    reviewButton.type = "button";
    reviewButton.className = "secondary-button";
    reviewButton.dataset.action = "task-quiz";
    reviewButton.dataset.taskId = task.id;
    reviewButton.textContent = "確認問題を解く";
    actions.appendChild(reviewButton);
  }

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "ghost-button task-action-small";
  editButton.dataset.action = "start-edit-task";
  editButton.dataset.taskId = task.id;
  editButton.textContent = "編集";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "ghost-button task-action-small task-action-delete";
  deleteButton.dataset.action = "delete-task";
  deleteButton.dataset.taskId = task.id;
  deleteButton.textContent = "削除";

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);
  card.appendChild(actions);

  return card;
}
