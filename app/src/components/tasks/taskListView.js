import { createTaskCard } from "./taskCardView.js";

export function renderTaskList(container, tasks) {
  container.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "task-meta";
    empty.textContent = "復習したい論点をここに残します。";
    container.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    container.appendChild(createTaskCard(task));
  });
}
