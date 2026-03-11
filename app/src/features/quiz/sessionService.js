export const QUIZ_SET_STATUS = {
  PENDING: "pending",
  ANSWERED: "answered",
  GRADED: "graded",
  DISCARDED: "discarded",
};

export const QUIZ_SET_STATUS_LABEL = {
  [QUIZ_SET_STATUS.PENDING]: "出題中",
  [QUIZ_SET_STATUS.ANSWERED]: "回答済み・採点待ち",
  [QUIZ_SET_STATUS.GRADED]: "採点済み",
  [QUIZ_SET_STATUS.DISCARDED]: "終了済み",
};

export function createQuizSession(quiz) {
  return {
    quizSetId: quiz.id,
    subject: quiz.subject,
    topic: quiz.topic,
    createdAt: quiz.createdAt,
    quiz,
    questions: [
      {
        id: quiz.id,
        subject: quiz.subject,
        topic: quiz.topic,
        question_type: quiz.questionType ?? "multiple_choice",
        difficulty: quiz.difficulty ?? 1,
        question: quiz.question,
        choices: quiz.choices,
        correctChoiceId: quiz.correctChoiceId,
        reference: quiz.reference ?? "",
        explanation: quiz.explanation,
      },
    ],
    status: QUIZ_SET_STATUS.PENDING,
    selectedChoiceId: null,
    graded: false,
    isCorrect: false,
    explanationShown: false,
    userAnswerRaw: "",
    gradingResult: null,
  };
}

export function selectChoice(session, choiceId) {
  if (
    !session
    || session.graded
    || session.status === QUIZ_SET_STATUS.ANSWERED
    || session.status === QUIZ_SET_STATUS.DISCARDED
  ) {
    return session;
  }

  session.selectedChoiceId = choiceId;
  const choice = session.quiz.choices.find((item) => item.id === choiceId);
  session.userAnswerRaw = choice?.text ?? "";
  return session;
}

export function answerSession(session) {
  if (!session || !session.selectedChoiceId || session.status !== QUIZ_SET_STATUS.PENDING) {
    return null;
  }

  session.status = QUIZ_SET_STATUS.ANSWERED;
  return session;
}

export function gradeSession(session) {
  if (
    !session
    || session.graded
    || !session.selectedChoiceId
    || session.status !== QUIZ_SET_STATUS.ANSWERED
  ) {
    return null;
  }

  session.graded = true;
  session.status = QUIZ_SET_STATUS.GRADED;
  session.isCorrect = session.selectedChoiceId === session.quiz.correctChoiceId;

  const correctChoice = session.quiz.choices.find((choice) => choice.id === session.quiz.correctChoiceId) ?? null;

  session.gradingResult = {
    gradedAt: new Date().toISOString(),
    isCorrect: session.isCorrect,
    correctChoiceId: session.quiz.correctChoiceId,
    correctChoiceText: correctChoice?.text ?? "",
    userChoiceId: session.selectedChoiceId,
  };

  return {
    isCorrect: session.isCorrect,
    correctChoice,
  };
}

export function markExplanationShown(session) {
  if (!session) {
    return null;
  }

  session.explanationShown = true;
  return session;
}

export function hasBlockingQuizSession(session) {
  return Boolean(
    session
    && (session.status === QUIZ_SET_STATUS.PENDING || session.status === QUIZ_SET_STATUS.ANSWERED),
  );
}

export function canCreateNewQuizSet(session) {
  return !hasBlockingQuizSession(session);
}

export function canAcceptGradingInput(session) {
  return Boolean(session && session.status === QUIZ_SET_STATUS.PENDING);
}

export function getQuizSessionStatusLabel(session) {
  if (!session) {
    return "";
  }

  return QUIZ_SET_STATUS_LABEL[session.status] ?? "";
}

export function formatQuizSetId(session) {
  if (!session?.quizSetId) {
    return "";
  }

  return session.quizSetId.replace(/^quiz_/, "").slice(0, 8);
}

function normalizeChoiceNumber(rawDigit) {
  const digitMap = {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "１": 1,
    "２": 2,
    "３": 3,
    "４": 4,
  };

  return digitMap[rawDigit] ?? null;
}

function findChoiceIdFromText(session, text) {
  const digitMatch = text.match(/([1-4１-４])/);
  if (digitMatch) {
    const choiceNumber = normalizeChoiceNumber(digitMatch[1]);
    if (choiceNumber) {
      return `choice_${choiceNumber - 1}`;
    }
  }

  const matchedChoice = session.quiz.choices.find((choice) => text.includes(choice.text));
  return matchedChoice?.id ?? null;
}

export function answerSessionFromText(session, text) {
  if (!session) {
    return {
      ok: false,
      reason: "missing_session",
    };
  }

  if (session.status === QUIZ_SET_STATUS.ANSWERED) {
    return {
      ok: false,
      reason: "already_answered",
    };
  }

  if (session.status === QUIZ_SET_STATUS.GRADED) {
    return {
      ok: false,
      reason: "already_graded",
    };
  }

  if (session.status === QUIZ_SET_STATUS.DISCARDED) {
    return {
      ok: false,
      reason: "discarded",
    };
  }

  const choiceId = findChoiceIdFromText(session, text);
  if (!choiceId) {
    return {
      ok: false,
      reason: "unrecognized_answer",
    };
  }

  session.selectedChoiceId = choiceId;
  session.userAnswerRaw = text;
  session.status = QUIZ_SET_STATUS.ANSWERED;

  const choice = session.quiz.choices.find((item) => item.id === choiceId) ?? null;

  return {
    ok: true,
    choice,
  };
}

export function discardQuizSession(session) {
  if (!session) {
    return null;
  }

  session.status = QUIZ_SET_STATUS.DISCARDED;
  return session;
}

export function applyGradingResponse(session, gradingResponse, userAnswerRaw = "") {
  if (!session || !gradingResponse?.results?.[0]) {
    return null;
  }

  const firstResult = gradingResponse.results[0];
  const correctChoice = session.quiz.choices.find((choice) => choice.id === firstResult.correct_choice_id) ?? null;
  session.status = QUIZ_SET_STATUS.GRADED;
  session.graded = true;
  session.selectedChoiceId = firstResult.user_choice_id ?? session.selectedChoiceId;
  session.userAnswerRaw = userAnswerRaw || firstResult.user_choice_id || session.userAnswerRaw;
  session.isCorrect = Boolean(firstResult.is_correct);
  session.gradingResult = {
    gradedAt: new Date().toISOString(),
    isCorrect: Boolean(firstResult.is_correct),
    correctChoiceId: firstResult.correct_choice_id,
    correctChoiceText: correctChoice?.text ?? firstResult.correct_choice_id,
    userChoiceId: firstResult.user_choice_id ?? null,
    feedbackComment: gradingResponse.feedback_comment,
    scoreText: gradingResponse.score_text,
  };

  return session.gradingResult;
}
