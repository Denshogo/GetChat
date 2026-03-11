import { formatDateTime } from "../../utils.js";
import {
  QUIZ_SET_STATUS,
  formatQuizSetId,
  getQuizSessionStatusLabel,
} from "../../features/quiz/sessionService.js";

function createActionButton(label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inline-action";
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

export function createQuizThreadCard(session) {
  const wrapper = document.createElement("article");
  wrapper.className = "quiz-thread-card";

  const head = document.createElement("div");
  head.className = "quiz-thread-head";

  const titleGroup = document.createElement("div");

  const title = document.createElement("p");
  title.className = "quiz-thread-title";
  title.textContent = session.topic || "確認問題";

  const meta = document.createElement("p");
  meta.className = "quiz-thread-meta";
  meta.textContent = `${session.subject} ・ ${formatQuizSetId(session)} ・ ${formatDateTime(session.createdAt)}`;

  titleGroup.append(title, meta);

  const state = document.createElement("p");
  state.className = `quiz-state status-${session.status}`;
  state.textContent = getQuizSessionStatusLabel(session);

  head.append(titleGroup, state);

  const question = document.createElement("p");
  question.className = "quiz-thread-question";
  question.textContent = session.quiz.question;

  const footer = document.createElement("div");
  footer.className = "quiz-thread-footer";

  const summary = document.createElement("p");
  summary.className = "quiz-thread-summary";

  if (session.status === QUIZ_SET_STATUS.PENDING) {
    summary.textContent = "回答前です。問題を開いて選択してください。";
  } else if (session.status === QUIZ_SET_STATUS.ANSWERED) {
    summary.textContent = `回答済み: ${session.userAnswerRaw || "選択済み"}。採点に進めます。`;
  } else if (session.status === QUIZ_SET_STATUS.GRADED) {
    const resultLabel = session.isCorrect ? "正解" : "不正解";
    const scoreText = session.gradingResult?.scoreText ?? "";
    const feedback = session.gradingResult?.feedbackComment ?? "";
    summary.textContent = [resultLabel, scoreText, feedback].filter(Boolean).join(" ・ ");
  } else {
    summary.textContent = "この問題セットは終了済みです。";
  }

  const actions = document.createElement("div");
  actions.className = "quiz-thread-actions";

  if (session.status !== QUIZ_SET_STATUS.DISCARDED) {
    actions.appendChild(createActionButton("問題を開く", "open-active-quiz"));
  }

  if (session.status === QUIZ_SET_STATUS.PENDING || session.status === QUIZ_SET_STATUS.ANSWERED) {
    actions.appendChild(createActionButton("この問題を終了する", "discard-active-quiz"));
  }

  if (session.status === QUIZ_SET_STATUS.GRADED) {
    actions.appendChild(createActionButton("類題を出す", "spawn-related-quiz"));
    actions.appendChild(createActionButton("論点を復習メモに追加", "add-task-from-quiz"));
    actions.appendChild(createActionButton("PDF化", "export-quiz-pdf"));
    actions.appendChild(createActionButton("次の問題を作る", "spawn-next-quiz"));
  }

  if (session.status === QUIZ_SET_STATUS.DISCARDED) {
    actions.appendChild(createActionButton("次の問題を作る", "spawn-next-quiz"));
  }

  footer.append(summary, actions);

  wrapper.append(head, question, footer);
  return wrapper;
}
