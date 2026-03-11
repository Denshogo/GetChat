import {
  QUIZ_SET_STATUS,
  formatQuizSetId,
  getQuizSessionStatusLabel,
} from "../../features/quiz/sessionService.js";

export function openQuizModal(dom, session) {
  renderQuizModal(dom, session);
  dom.quizModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

export function closeQuizModal(dom) {
  dom.quizModal.classList.add("hidden");
  document.body.style.overflow = "";
}

export function renderQuizOptions(dom, session) {
  dom.quizOptions.innerHTML = "";

  session.quiz.choices.forEach((choice, index) => {
    const row = document.createElement("label");
    row.className = "option-row";

    if (session.selectedChoiceId === choice.id) {
      row.classList.add("selected");
    }

    if (session.graded && choice.id === session.quiz.correctChoiceId) {
      row.classList.add("correct");
    }

    if (
      session.graded
      && session.selectedChoiceId === choice.id
      && choice.id !== session.quiz.correctChoiceId
    ) {
      row.classList.add("wrong");
    }

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "quiz-choice";
    radio.value = choice.id;
    radio.checked = session.selectedChoiceId === choice.id;
    radio.disabled = session.graded || session.status === QUIZ_SET_STATUS.ANSWERED;

    const text = document.createElement("span");
    text.textContent = `${index + 1}. ${choice.text}`;

    row.appendChild(radio);
    row.appendChild(text);
    dom.quizOptions.appendChild(row);
  });
}

export function renderQuizModal(dom, session) {
  const quiz = session.quiz;
  dom.quizSubject.textContent = quiz.subject;
  dom.quizTitle.textContent = "確認問題";
  dom.quizTopic.textContent = `論点: ${quiz.topic}`;
  dom.quizSetId.textContent = `セットID: ${formatQuizSetId(session)}`;
  dom.quizQuestion.textContent = quiz.question;
  dom.quizState.textContent = getQuizSessionStatusLabel(session);
  dom.quizState.className = `quiz-state status-${session.status}`;

  if (!session.graded) {
    dom.quizResult.textContent = "";
    dom.quizResult.className = "quiz-result";
  }

  if (!session.explanationShown) {
    dom.quizExplanation.textContent = "";
    dom.quizExplanation.classList.add("hidden");
  }

  dom.submitQuizAnswerButton.disabled = !session.selectedChoiceId || session.status !== QUIZ_SET_STATUS.PENDING;
  dom.gradeQuizButton.disabled = session.status !== QUIZ_SET_STATUS.ANSWERED;
  dom.showExplanationButton.classList.toggle("hidden", !session.graded || session.explanationShown);
  dom.spawnRelatedQuizButton.classList.toggle("hidden", session.status !== QUIZ_SET_STATUS.GRADED);
  dom.spawnNextQuizButton.classList.toggle("hidden", session.status !== QUIZ_SET_STATUS.GRADED);

  renderQuizOptions(dom, session);
}

export function renderQuizResult(dom, { isCorrect, correctChoiceText, feedbackComment = "" }) {
  dom.quizResult.classList.add("show");
  dom.quizResult.classList.remove("correct", "wrong");

  if (isCorrect) {
    dom.quizResult.classList.add("correct");
    dom.quizResult.textContent = feedbackComment
      ? `正解です。正答: ${correctChoiceText} ${feedbackComment}`
      : `正解です。正答: ${correctChoiceText}`;
  } else {
    dom.quizResult.classList.add("wrong");
    dom.quizResult.textContent = feedbackComment
      ? `不正解です。正答: ${correctChoiceText} ${feedbackComment}`
      : `不正解です。正答: ${correctChoiceText}`;
  }
}

export function showQuizExplanation(dom, explanation) {
  dom.quizExplanation.textContent = explanation;
  dom.quizExplanation.classList.remove("hidden");
  dom.showExplanationButton.classList.add("hidden");
}
