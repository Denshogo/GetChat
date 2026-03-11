export const STORAGE_KEYS = {
  TASKS: "shihoshoshi.tasks.v1",
  PROGRESS: "shihoshoshi.progress.v1",
  CONVERSATIONS: "shihoshoshi.conversations.v1",
};

export const SUBJECTS = [
  "民法",
  "不動産登記法",
  "商法・会社法",
  "民事訴訟法",
  "民事執行法",
  "民事保全法",
  "供託法",
  "司法書士法",
  "憲法",
  "刑法",
];

export const DEFAULT_SUBJECT = "民法";

export const POINTS = {
  FIRST_CORRECT: 5,
  EXPLANATION_AFTER_WRONG: 2,
};

export const RANK_THRESHOLDS = [
  { name: "テーブルマウンテン", minPoints: 0 },
  { name: "高尾山", minPoints: 20 },
  { name: "富士山", minPoints: 50 },
  { name: "キリマンジャロ", minPoints: 100 },
  { name: "エベレスト", minPoints: 200 },
];

export const CHAT_SUGGESTIONS = {
  ADD_TASK: "この論点を復習メモに追加する",
  RELATED_QUIZ: "関連問題を解く",
};
