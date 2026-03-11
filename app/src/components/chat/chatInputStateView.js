import { resolveChatModeUiState } from "../../features/chat/modeConfig.js";
import { canAcceptGradingInput, hasBlockingQuizSession } from "../../features/quiz/sessionService.js";

export function renderChatInputState(dom, selectedMode, currentQuizSession) {
  const mode = resolveChatModeUiState({
    selectedMode,
    hasBlockingQuizSet: hasBlockingQuizSession(currentQuizSession),
    canUseGradingMode: canAcceptGradingInput(currentQuizSession),
    quizSetStatus: currentQuizSession?.status ?? null,
  });

  dom.chatInput.disabled = mode.isInputDisabled;
  dom.chatInput.placeholder = mode.placeholder;
  dom.chatInput.dataset.modeTone = mode.tone;
}
