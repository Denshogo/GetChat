export const CHAT_MODES = [
  {
    id: "explain",
    label: "解説",
    tone: "mode-explain",
    summary: "わからない論点を入力",
    hint: "わからない論点を入力",
    placeholder: "わからない論点を入力",
  },
  {
    id: "quiz",
    label: "作問",
    tone: "mode-quiz",
    summary: "出したい問題を入力",
    hint: "出したい問題を入力",
    placeholder: "出したい問題を入力",
  },
  {
    id: "grading",
    label: "採点",
    tone: "mode-grading",
    summary: "例: 1 ○ 2 × 3 ア",
    hint: "例: 1 ○ 2 × 3 ア",
    placeholder: "例: 1 ○ 2 × 3 ア",
  },
];

export const CHAT_MODE_MAP = Object.fromEntries(
  CHAT_MODES.map((mode) => [mode.id, mode]),
);

export const CHAT_MODE_UNSELECTED = {
  label: "未選択",
  hint: "質問してみましょう",
  placeholder: "質問してみましょう",
  tone: "mode-unselected",
};

export function resolveChatModeUiState({
  selectedMode,
  hasBlockingQuizSet,
  canUseGradingMode,
  quizSetStatus,
}) {
  if (!selectedMode) {
    return {
      ...CHAT_MODE_UNSELECTED,
      isInputDisabled: false,
      isSubmitDisabled: false,
    };
  }

  const base = CHAT_MODE_MAP[selectedMode];

  if (selectedMode === "quiz" && hasBlockingQuizSet) {
    return {
      ...base,
      hint: "未完了の問題があります。先に完了または終了してください",
      placeholder: "未完了の問題があります。先に完了または終了してください",
      isInputDisabled: true,
      isSubmitDisabled: true,
    };
  }

  if (selectedMode === "grading" && quizSetStatus === "answered") {
    return {
      ...base,
      hint: "回答済みです。問題カードで採点してください",
      placeholder: "回答済みです。問題カードで採点してください",
      isInputDisabled: true,
      isSubmitDisabled: true,
    };
  }

  if (selectedMode === "grading" && !canUseGradingMode) {
    return {
      ...base,
      hint: "先に問題を作成してください",
      placeholder: "先に問題を作成してください",
      isInputDisabled: true,
      isSubmitDisabled: true,
    };
  }

  return {
    ...base,
    isInputDisabled: false,
    isSubmitDisabled: false,
  };
}
