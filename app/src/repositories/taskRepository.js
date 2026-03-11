import { STORAGE_KEYS } from "../constants.js";
import { loadJson, saveJson } from "../storage.js";
import { createId, normalizeTopic } from "../utils.js";

const DEFAULT_TASKS = [];

export class TaskRepository {
  list() {
    const tasks = loadJson(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    return [...tasks].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  add(title) {
    const normalized = normalizeTopic(title);
    if (!normalized) {
      return null;
    }

    const now = new Date().toISOString();
    const tasks = this.list();

    const duplicate = tasks.find((task) => task.title === normalized);
    if (duplicate) {
      return {
        task: duplicate,
        isNew: false,
      };
    }

    const newTask = {
      id: createId("task"),
      title: normalized,
      created_at: now,
      is_completed: false,
      completed_at: null,
      review_count: 0,
      last_reviewed_at: null,
      next_review_at: null,
    };

    saveJson(STORAGE_KEYS.TASKS, [newTask, ...tasks]);
    return {
      task: newTask,
      isNew: true,
    };
  }

  setCompleted(taskId, isCompleted) {
    const now = new Date().toISOString();
    const tasks = this.list().map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        is_completed: isCompleted,
        completed_at: isCompleted ? now : null,
      };
    });

    saveJson(STORAGE_KEYS.TASKS, tasks);
  }

  markReviewed(taskId) {
    const now = new Date().toISOString();
    const tasks = this.list().map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        review_count: (task.review_count ?? 0) + 1,
        last_reviewed_at: now,
      };
    });

    saveJson(STORAGE_KEYS.TASKS, tasks);
  }

  findById(taskId) {
    return this.list().find((task) => task.id === taskId) ?? null;
  }

  remove(taskId) {
    const tasks = this.list().filter((task) => task.id !== taskId);
    saveJson(STORAGE_KEYS.TASKS, tasks);
  }

  updateTitle(taskId, newTitle) {
    const normalized = normalizeTopic(newTitle);
    if (!normalized) {
      return;
    }

    const tasks = this.list().map((task) =>
      task.id === taskId ? { ...task, title: normalized } : task,
    );
    saveJson(STORAGE_KEYS.TASKS, tasks);
  }
}
