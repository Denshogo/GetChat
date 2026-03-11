export function toActiveQuizData(session) {
  if (!session) {
    return null;
  }

  return {
    quiz_set_id: session.quizSetId,
    subject: session.subject ?? null,
    topic: session.topic ?? null,
    status: session.status ?? null,
    user_answer_raw: session.userAnswerRaw ?? null,
    questions: (session.questions ?? []).map((question, index) => ({
      question_number: index + 1,
      question_type: question.question_type ?? "multiple_choice",
      difficulty: Number(question.difficulty ?? 1),
      question_text: question.question,
      choices: (question.choices ?? []).map((choice) => ({
        choice_id: choice.id,
        text: choice.text,
      })),
      correct_choice_id: question.correctChoiceId,
      reference: question.reference ?? "基本条文",
      explanation: question.explanation ?? "",
    })),
  };
}
