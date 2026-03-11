import { DEFAULT_SUBJECT } from "./constants.js";
import { ConversationRepository } from "./repositories/conversationRepository.js";
import { ProgressRepository } from "./repositories/progressRepository.js";
import { TaskRepository } from "./repositories/taskRepository.js";
import { AiClient } from "./services/aiClient.js";
import { normalizeTopic } from "./utils.js";
import { AppStore } from "./state/appStore.js";
import { createAssistantMessage, createUserMessage } from "./features/chat/messageFactory.js";
import { ChatFeatureService } from "./features/chat/service.js";
import { TaskFeatureService } from "./features/tasks/service.js";
import {
  applyGradingResponse,
  answerSession,
  canCreateNewQuizSet,
  createQuizSession,
  discardQuizSession,
  markExplanationShown,
  selectChoice,
} from "./features/quiz/sessionService.js";
import { exportQuizSessionAsPdf } from "./features/quiz/exportService.js";
import { GamificationService } from "./features/gamification/service.js";
import { renderConversationList, renderMenuState } from "./components/layout/menuView.js";
import { renderProgressModal, renderProgressModalState } from "./components/layout/progressModalView.js";
import { renderChatMessageList } from "./components/chat/chatMessageListView.js";
import { renderChatModeSelector } from "./components/chat/chatModeSelectorView.js";
import { renderChatInputState } from "./components/chat/chatInputStateView.js";
import { renderTaskList } from "./components/tasks/taskListView.js";
import { renderTaskModalState } from "./components/tasks/taskDrawerView.js";
import {
  closeQuizModal as closeQuizModalView,
  openQuizModal as openQuizModalView,
  renderQuizModal,
  renderQuizResult,
  showQuizExplanation,
} from "./components/quiz/quizModalView.js";
import { CHAT_MODE_MAP, CHAT_MODES } from "./features/chat/modeConfig.js";

function deriveConversationTitle(messages, fallbackTitle = "新しいチャット") {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content?.trim());
  if (!firstUserMessage) {
    return fallbackTitle;
  }

  const normalized = firstUserMessage.content.replace(/[\s\n\r]+/g, " ").trim();
  if (normalized.length <= 28) {
    return normalized;
  }

  return `${normalized.slice(0, 28)}…`;
}

export class StudySupportApp {
  constructor() {
    const taskRepository = new TaskRepository();
    const progressRepository = new ProgressRepository();
    this.conversationRepository = new ConversationRepository();
    const { conversations, activeConversation } = this.conversationRepository.ensureInitialized();

    this.aiClient = new AiClient();
    this.taskFeature = new TaskFeatureService({ taskRepository });
    this.chatFeature = new ChatFeatureService({
      aiClient: this.aiClient,
    });
    this.gamificationFeature = new GamificationService({ progressRepository });

    this.store = new AppStore({
      tasks: this.taskFeature.list(),
      conversations,
      currentConversationId: activeConversation.conversation_id,
      messages: activeConversation.messages,
      currentQuizSession: activeConversation.active_quiz_set,
      selectedChatMode: activeConversation.selected_mode,
      selectedSubject: activeConversation.selected_subject ?? DEFAULT_SUBJECT,
    });

    this.noticeTimer = null;
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.renderAll();
  }

  cacheDom() {
    this.dom = {
      workspaceScreen: document.getElementById("workspaceScreen"),
      workspaceMenuButton: document.getElementById("workspaceMenuButton"),
      conversationTitle: document.getElementById("conversationTitle"),
      menuDrawer: document.getElementById("menuDrawer"),
      closeMenuButton: document.getElementById("closeMenuButton"),
      openGuideButton: document.getElementById("openGuideButton"),
      openTaskModalButton: document.getElementById("openTaskModalButton"),
      openProgressModalButton: document.getElementById("openProgressModalButton"),
      newConversationButton: document.getElementById("newConversationButton"),
      conversationList: document.getElementById("conversationList"),
      chatHistory: document.getElementById("chatHistory"),
      quickMemoButton: document.getElementById("quickMemoButton"),
      chatForm: document.getElementById("chatForm"),
      chatModeSelector: document.getElementById("chatModeSelector"),
      chatInput: document.getElementById("chatInput"),
      chatCancelButton: document.getElementById("chatCancelButton"),
      chatSubmitButton: document.getElementById("chatSubmitButton"),
      randomQuizButton: document.getElementById("randomQuizButton"),
      guideModal: document.getElementById("guideModal"),
      progressModal: document.getElementById("progressModal"),
      progressModalPoints: document.getElementById("progressModalPoints"),
      progressModalRank: document.getElementById("progressModalRank"),
      progressModalNext: document.getElementById("progressModalNext"),
      taskModal: document.getElementById("taskModal"),
      taskForm: document.getElementById("taskForm"),
      taskInput: document.getElementById("taskInput"),
      taskList: document.getElementById("taskList"),
      quizModal: document.getElementById("quizModal"),
      quizSubject: document.getElementById("quizSubject"),
      quizTitle: document.getElementById("quizTitle"),
      quizTopic: document.getElementById("quizTopic"),
      quizSetId: document.getElementById("quizSetId"),
      quizState: document.getElementById("quizState"),
      quizQuestion: document.getElementById("quizQuestion"),
      quizOptions: document.getElementById("quizOptions"),
      quizResult: document.getElementById("quizResult"),
      quizExplanation: document.getElementById("quizExplanation"),
      submitQuizAnswerButton: document.getElementById("submitQuizAnswerButton"),
      gradeQuizButton: document.getElementById("gradeQuizButton"),
      showExplanationButton: document.getElementById("showExplanationButton"),
      spawnRelatedQuizButton: document.getElementById("spawnRelatedQuizButton"),
      spawnNextQuizButton: document.getElementById("spawnNextQuizButton"),
      exportQuizPdfButton: document.getElementById("exportQuizPdfButton"),
      discardQuizButton: document.getElementById("discardQuizButton"),
      addQuizTopicTaskButton: document.getElementById("addQuizTopicTaskButton"),
      notice: document.getElementById("notice"),
    };
  }

  bindEvents() {
    this.dom.workspaceMenuButton.addEventListener("click", () => {
      this.openMenu();
    });

    this.dom.chatForm.addEventListener("submit", (event) => {
      void this.handleChatSubmit(event);
    });

    this.dom.quickMemoButton.addEventListener("click", () => {
      this.openTaskModal();
    });

    this.dom.chatCancelButton.addEventListener("click", () => {
      this.handleCancelChatDraft();
    });

    this.dom.chatInput.addEventListener("input", () => {
      this.renderChatActionButtons();
    });

    this.dom.chatModeSelector.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const button = target.closest("[data-mode]");
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const mode = button.dataset.mode;
      if (mode == null) {
        return;
      }

      const previousMode = this.store.getState().selectedChatMode;
      const hasDraft = this.hasChatDraft();
      const nextMode = previousMode === mode ? null : mode;

      if (previousMode !== nextMode && hasDraft) {
        this.clearChatDraft();
      }

      this.store.setSelectedChatMode(nextMode);
      this.persistCurrentConversation();
      this.renderChatComposer();
      this.showNotice(
        previousMode !== nextMode && hasDraft
          ? nextMode
            ? `入力モードを「${CHAT_MODE_MAP[nextMode]?.label ?? nextMode}」に切り替えました。入力内容をクリアしました`
            : "入力モードを解除しました。入力内容をクリアしました"
          : nextMode
            ? `入力モードを「${CHAT_MODE_MAP[nextMode]?.label ?? nextMode}」に切り替えました`
            : "入力モードを解除しました",
      );

      if (!this.dom.chatInput.disabled) {
        this.dom.chatInput.focus();
      }
    });

    this.dom.randomQuizButton.addEventListener("click", () => {
      void this.handleRandomQuiz();
    });

    this.dom.openGuideButton.addEventListener("click", () => {
      this.openGuideModal();
    });

    this.dom.openTaskModalButton.addEventListener("click", () => {
      this.openTaskModal();
    });

    this.dom.openProgressModalButton.addEventListener("click", () => {
      this.openProgressModal();
    });

    this.dom.newConversationButton.addEventListener("click", () => {
      this.createNewConversation();
    });

    this.dom.conversationList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const button = target.closest("[data-conversation-id]");
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const conversationId = button.dataset.conversationId;
      if (!conversationId) {
        return;
      }

      this.switchConversation(conversationId);
    });

    this.dom.chatHistory.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const action = target.dataset.action;
      if (!action) {
        return;
      }

      if (action === "open-active-quiz") {
        this.reopenCurrentQuiz();
        return;
      }

      if (action === "discard-active-quiz") {
        this.discardCurrentQuiz();
        return;
      }

      if (action === "spawn-related-quiz") {
        void this.handleSpawnRelatedQuiz();
        return;
      }

      if (action === "spawn-next-quiz") {
        void this.handleSpawnNextQuiz();
        return;
      }

      if (action === "add-task-from-quiz") {
        const session = this.store.getState().currentQuizSession;
        if (!session) {
          return;
        }

        this.addTask(session.topic);
        return;
      }

      if (action === "export-quiz-pdf") {
        this.handleExportQuizPdf();
        return;
      }

      const topic = normalizeTopic(target.dataset.topic ?? "");
      if (!topic) {
        return;
      }

      if (action === "add-task") {
        this.addTask(topic);
        return;
      }

      if (action === "related-quiz") {
        void this.handleRelatedTopicQuiz(topic);
      }
    });

    this.dom.taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = this.dom.taskInput.value.trim();
      if (!title) {
        return;
      }

      const added = this.addTask(title);
      if (added) {
        this.dom.taskInput.value = "";
      }
    });

    this.dom.taskList.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.dataset.action !== "toggle-task") {
        return;
      }

      const taskId = target.dataset.taskId;
      if (!taskId) {
        return;
      }

      const tasks = this.taskFeature.setCompleted(taskId, target.checked);
      this.store.setTasks(tasks);
      this.renderTasks();
    });

    this.dom.taskList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      if (target.dataset.action !== "task-quiz") {
        return;
      }

      const taskId = target.dataset.taskId;
      if (!taskId) {
        return;
      }

      const task = this.taskFeature.findById(taskId);
      if (!task) {
        return;
      }

      void this.handleTaskQuiz(task);
    });

    this.dom.quizOptions.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const session = this.store.getState().currentQuizSession;
      if (!session || session.graded) {
        return;
      }

      selectChoice(session, target.value);
      renderQuizModal(this.dom, session);
      this.persistCurrentConversation();
    });

    this.dom.submitQuizAnswerButton.addEventListener("click", () => {
      this.handleSubmitQuizAnswer();
    });

    this.dom.gradeQuizButton.addEventListener("click", () => {
      void this.gradeCurrentQuiz();
    });

    this.dom.showExplanationButton.addEventListener("click", () => {
      this.handleShowExplanation();
    });

    this.dom.spawnRelatedQuizButton.addEventListener("click", () => {
      void this.handleSpawnRelatedQuiz();
    });

    this.dom.spawnNextQuizButton.addEventListener("click", () => {
      void this.handleSpawnNextQuiz();
    });

    this.dom.exportQuizPdfButton.addEventListener("click", () => {
      this.handleExportQuizPdf();
    });

    this.dom.discardQuizButton.addEventListener("click", () => {
      this.discardCurrentQuiz();
    });

    this.dom.addQuizTopicTaskButton.addEventListener("click", () => {
      const session = this.store.getState().currentQuizSession;
      if (!session) {
        return;
      }

      this.addTask(session.quiz.topic);
    });

    this.dom.quizModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.action === "close-modal") {
        this.closeQuizModal();
      }
    });

    this.dom.taskModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.action === "close-task-modal") {
        this.closeTaskModal();
      }
    });

    this.dom.guideModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.action === "close-guide-modal") {
        this.closeGuideModal();
      }
    });

    this.dom.progressModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.action === "close-progress-modal") {
        this.closeProgressModal();
      }
    });

    this.dom.menuDrawer.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.action === "close-menu") {
        this.closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!this.dom.quizModal.classList.contains("hidden")) {
        this.closeQuizModal();
        return;
      }

      if (!this.dom.taskModal.classList.contains("hidden")) {
        this.closeTaskModal();
        return;
      }

      if (!this.dom.progressModal.classList.contains("hidden")) {
        this.closeProgressModal();
        return;
      }

      if (!this.dom.guideModal.classList.contains("hidden")) {
        this.closeGuideModal();
        return;
      }

      if (!this.dom.menuDrawer.classList.contains("hidden")) {
        this.closeMenu();
      }
    });
  }

  renderAll() {
    this.renderMenu();
    this.renderConversationTitle();
    this.renderProgress();
    this.renderMessages();
    this.renderTaskModalState();
    this.renderGuideModalState();
    this.renderProgressModalState();
    this.renderTasks();
    this.renderChatComposer();
  }

  renderMenu() {
    const state = this.store.getState();
    renderMenuState(this.dom, state.isMenuOpen);
    renderConversationList(
      this.dom.conversationList,
      state.conversations,
      state.currentConversationId,
    );
  }

  renderProgress() {
    renderProgressModal(this.dom, this.gamificationFeature.getProgressView());
  }

  renderGuideModalState() {
    this.dom.guideModal.classList.toggle("hidden", !this.store.getState().isGuideModalOpen);
  }

  renderProgressModalState() {
    renderProgressModalState(this.dom, this.store.getState().isProgressModalOpen);
  }

  renderMessages() {
    const { messages, currentQuizSession } = this.store.getState();
    renderChatMessageList(this.dom.chatHistory, messages, currentQuizSession);
  }

  renderChatComposer() {
    const { selectedChatMode, currentQuizSession } = this.store.getState();
    renderChatModeSelector(this.dom.chatModeSelector, CHAT_MODES, selectedChatMode);
    renderChatInputState(this.dom, selectedChatMode, currentQuizSession);
    this.renderChatActionButtons();
  }

  renderChatActionButtons() {
    const hasDraft = this.hasChatDraft();
    const canCancel = !this.dom.chatInput.disabled && hasDraft;
    const canSubmit = !this.dom.chatInput.disabled && hasDraft;
    this.dom.chatCancelButton.disabled = !canCancel;
    this.dom.chatCancelButton.classList.toggle("hidden", !canCancel);
    this.dom.chatSubmitButton.disabled = !canSubmit;
  }

  renderConversationTitle() {
    const state = this.store.getState();
    const activeConversation = state.conversations.find(
      (conversation) => conversation.conversation_id === state.currentConversationId,
    );

    this.dom.conversationTitle.textContent = activeConversation?.title ?? "新しいチャット";
  }

  renderTaskModalState() {
    renderTaskModalState(this.dom, this.store.getState().isTaskPanelOpen);
  }

  renderTasks() {
    renderTaskList(this.dom.taskList, this.store.getState().tasks);
  }

  buildConversationSnapshot() {
    const state = this.store.getState();
    const existing = this.conversationRepository.findById(state.currentConversationId);
    const now = new Date().toISOString();
    return {
      conversation_id: state.currentConversationId,
      title: deriveConversationTitle(state.messages, existing?.title ?? "新しいチャット"),
      created_at: existing?.created_at ?? now,
      updated_at: now,
      messages: state.messages,
      active_quiz_set: state.currentQuizSession,
      selected_mode: state.selectedChatMode,
      selected_subject: state.selectedSubject,
    };
  }

  persistCurrentConversation() {
    const conversationId = this.store.getState().currentConversationId;
    if (!conversationId) {
      return;
    }

    const conversations = this.conversationRepository.saveConversation(this.buildConversationSnapshot());
    this.store.setConversations(conversations);
  }

  applyConversation(conversation) {
    if (!conversation) {
      return;
    }

    this.closeQuizModal();
    this.clearChatDraft();
    this.store.setCurrentConversationId(conversation.conversation_id);
    this.store.setMessages(conversation.messages ?? []);
    this.store.setSelectedChatMode(conversation.selected_mode ?? null);
    this.store.setSelectedSubject(conversation.selected_subject ?? DEFAULT_SUBJECT);
    this.store.setCurrentQuizSession(conversation.active_quiz_set ?? null);
  }

  async handleChatSubmit(event) {
    event.preventDefault();

    const text = this.dom.chatInput.value.trim();
    if (!text) {
      return;
    }

    const { selectedChatMode } = this.store.getState();

    this.store.addMessage(createUserMessage(text));
    this.persistCurrentConversation();
    this.dom.chatInput.value = "";
    this.renderMessages();
    this.renderChatActionButtons();
    this.renderConversationTitle();
    this.renderMenu();

    const selectedSubject = this.store.getState().selectedSubject;
    const activeQuizSession = this.store.getState().currentQuizSession;
    let response;
    try {
      response = await this.chatFeature.handleUserInput({
        text,
        selectedSubject,
        selectedMode: selectedChatMode,
        activeQuizSession,
      });
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : "AI応答の取得に失敗しました");
      return;
    }

    if (response.type === "blocked") {
      this.showNotice(response.notice);
      this.renderChatComposer();
      return;
    }

    if (response.type === "quiz_request") {
      this.startQuizSet(response.quiz);
    }

    if (response.type === "grading_answered") {
      this.store.setCurrentQuizSession(response.activeQuizSession);
      this.persistCurrentConversation();
      this.openExistingQuizSession();
      this.renderChatComposer();
      this.renderMessages();
      this.renderMenu();
    }

    if (response.assistantReply) {
      this.store.addMessage(
        createAssistantMessage({
          ...response.assistantReply,
          relatedSubject: selectedSubject,
        }),
      );
      this.persistCurrentConversation();
      this.renderMessages();
      this.renderConversationTitle();
      this.renderMenu();
    }
  }

  async generateQuizWithHandling({ text, subject, source, taskId = null }) {
    try {
      return await this.aiClient.generateQuiz({
        text,
        subject,
        source,
        taskId,
      });
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : "問題生成に失敗しました");
      return null;
    }
  }

  async handleRandomQuiz() {
    const selectedSubject = this.store.getState().selectedSubject;
    const quiz = await this.generateQuizWithHandling({
      text: `${selectedSubject}の主要論点からランダムで確認問題を1問作って`,
      subject: selectedSubject,
      source: "random",
      taskId: null,
    });

    if (quiz) {
      this.startQuizSet(quiz);
    }
  }

  async handleRelatedTopicQuiz(topic) {
    const selectedSubject = this.store.getState().selectedSubject;
    const quiz = await this.generateQuizWithHandling({
      text: `${topic}の確認問題を1問作って`,
      subject: selectedSubject,
      source: "chat",
      taskId: null,
    });

    if (quiz) {
      this.startQuizSet(quiz);
    }
  }

  async handleTaskQuiz(task) {
    const selectedSubject = this.store.getState().selectedSubject;
    const quiz = await this.generateQuizWithHandling({
      text: `${task.title}の確認問題を1問作って`,
      subject: selectedSubject,
      source: "task",
      taskId: task.id,
    });

    if (quiz && this.startQuizSet(quiz)) {
      this.closeTaskModal();
    }
  }

  startQuizSet(quiz) {
    const currentQuizSession = this.store.getState().currentQuizSession;
    if (!canCreateNewQuizSet(currentQuizSession)) {
      this.showNotice("未完了の問題セットがあります。先に回答・採点を完了するか、問題を終了してください。");
      this.renderChatComposer();
      return false;
    }

    const session = createQuizSession(quiz);
    this.store.setCurrentQuizSession(session);
    this.persistCurrentConversation();
    this.openExistingQuizSession();
    this.renderMessages();
    this.renderChatComposer();
    this.renderMenu();
    return true;
  }

  openExistingQuizSession() {
    const session = this.store.getState().currentQuizSession;
    if (!session) {
      return;
    }

    this.store.setQuizModalOpen(true);
    openQuizModalView(this.dom, session);
  }

  closeQuizModal() {
    closeQuizModalView(this.dom);
    this.store.setQuizModalOpen(false);
  }

  openMenu() {
    this.store.setMenuOpen(true);
    this.renderMenu();
  }

  closeMenu() {
    this.store.setMenuOpen(false);
    this.renderMenu();
  }

  openGuideModal() {
    this.closeMenu();
    this.store.setGuideModalOpen(true);
    this.renderGuideModalState();
  }

  closeGuideModal() {
    this.store.setGuideModalOpen(false);
    this.renderGuideModalState();
  }

  openProgressModal() {
    this.closeMenu();
    this.renderProgress();
    this.store.setProgressModalOpen(true);
    this.renderProgressModalState();
  }

  closeProgressModal() {
    this.store.setProgressModalOpen(false);
    this.renderProgressModalState();
  }

  openTaskModal() {
    this.closeMenu();
    this.store.setTaskPanelOpen(true);
    this.renderTaskModalState();
    this.dom.taskInput.focus();
  }

  closeTaskModal() {
    this.store.setTaskPanelOpen(false);
    this.renderTaskModalState();
  }

  createNewConversation() {
    const { conversations, activeConversation } = this.conversationRepository.createConversation();
    this.store.setConversations(conversations);
    this.applyConversation(activeConversation);
    this.closeMenu();
    this.closeGuideModal();
    this.closeProgressModal();
    this.renderAll();
    this.dom.chatInput.focus();
    this.showNotice("新しいチャットを開きました");
  }

  switchConversation(conversationId) {
    const conversation = this.conversationRepository.setActiveConversation(conversationId);
    if (!conversation) {
      return;
    }

    this.applyConversation(conversation);
    this.closeMenu();
    this.closeGuideModal();
    this.closeProgressModal();
    this.closeTaskModal();
    this.renderAll();
  }

  hasChatDraft() {
    return this.dom.chatInput.value.trim().length > 0;
  }

  clearChatDraft() {
    this.dom.chatInput.value = "";
    this.renderChatActionButtons();
  }

  handleCancelChatDraft() {
    if (!this.hasChatDraft()) {
      return;
    }

    this.clearChatDraft();
    this.showNotice("入力内容を取りやめました");
  }

  handleSubmitQuizAnswer() {
    const session = this.store.getState().currentQuizSession;
    const answered = answerSession(session);
    if (!answered) {
      return;
    }

    this.persistCurrentConversation();
    renderQuizModal(this.dom, session);
    this.renderChatComposer();
    this.renderMessages();
    this.renderMenu();
    this.showNotice("回答を登録しました。続けて採点できます");
  }

  async gradeCurrentQuiz() {
    const session = this.store.getState().currentQuizSession;
    if (!session || session.status !== "answered") {
      return;
    }

    let gradingResponse;
    try {
      gradingResponse = await this.aiClient.gradeQuiz({
        text: session.userAnswerRaw || session.selectedChoiceId || "",
        subject: session.subject,
        activeQuizSession: session,
      });
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : "採点に失敗しました");
      return;
    }

    const result = applyGradingResponse(session, gradingResponse, session.userAnswerRaw);
    if (!result) {
      this.showNotice("採点結果の反映に失敗しました");
      return;
    }

    this.persistCurrentConversation();
    renderQuizResult(this.dom, {
      isCorrect: session.isCorrect,
      correctChoiceText: result.correctChoiceText ?? "",
      feedbackComment: gradingResponse.feedback_comment,
    });

    if (session.isCorrect) {
      const awardResult = this.gamificationFeature.awardFirstCorrect(session.quiz.key);
      if (awardResult.awarded) {
        this.renderProgress();
        this.showNotice(`初回正解 +${awardResult.points}pt`);
      }
    }

    if (session.quiz.taskId) {
      const tasks = this.taskFeature.markReviewed(session.quiz.taskId);
      this.store.setTasks(tasks);
      this.renderTasks();
    }

    renderQuizModal(this.dom, session);
    this.renderChatComposer();
    this.renderMessages();
    this.renderMenu();
  }

  handleShowExplanation() {
    const session = this.store.getState().currentQuizSession;
    if (!session) {
      return;
    }

    showQuizExplanation(this.dom, session.quiz.explanation);
    markExplanationShown(session);
    this.persistCurrentConversation();

    if (!session.isCorrect) {
      const awardResult = this.gamificationFeature.awardExplanationAfterWrong(session.quiz.key);
      if (awardResult.awarded) {
        this.renderProgress();
        this.showNotice(`解説確認 +${awardResult.points}pt`);
      }
    }
  }

  handleExportQuizPdf() {
    const session = this.store.getState().currentQuizSession;
    const exported = exportQuizSessionAsPdf(session);

    if (!exported) {
      this.showNotice("PDF化を開始できませんでした");
      return;
    }

    this.showNotice("PDF化ダイアログを開きました");
  }

  discardCurrentQuiz() {
    const session = this.store.getState().currentQuizSession;
    if (!session) {
      return;
    }

    discardQuizSession(session);
    this.persistCurrentConversation();
    this.closeQuizModal();
    this.store.setCurrentQuizSession(session);
    this.renderMessages();
    this.renderChatComposer();
    this.renderMenu();
    this.showNotice("問題セットを終了しました。次の問題を作成できます");
  }

  reopenCurrentQuiz() {
    const session = this.store.getState().currentQuizSession;
    if (!session || session.status === "discarded") {
      return;
    }

    this.openExistingQuizSession();
  }

  async handleSpawnRelatedQuiz() {
    const session = this.store.getState().currentQuizSession;
    if (!session) {
      return;
    }

    const quiz = await this.generateQuizWithHandling({
      text: `${session.topic}の類題を1問作って`,
      subject: session.subject,
      source: "related",
      taskId: null,
    });

    if (quiz) {
      this.startQuizSet(quiz);
    }
  }

  async handleSpawnNextQuiz() {
    const selectedSubject = this.store.getState().selectedSubject;
    const quiz = await this.generateQuizWithHandling({
      text: `${selectedSubject}の主要論点からランダムで確認問題を1問作って`,
      subject: selectedSubject,
      source: "random",
      taskId: null,
    });

    if (quiz) {
      this.startQuizSet(quiz);
    }
  }

  addTask(rawTitle) {
    const result = this.taskFeature.addTask(rawTitle);
    if (!result) {
      return false;
    }

    this.store.setTasks(this.taskFeature.list());
    this.renderTasks();

    this.showNotice(
      result.isNew
        ? `復習メモ「${result.task.title}」を追加しました`
        : `復習メモ「${result.task.title}」は既に登録済みです`,
    );

    return true;
  }

  showNotice(message) {
    if (this.noticeTimer) {
      window.clearTimeout(this.noticeTimer);
    }

    this.dom.notice.textContent = message;
    this.dom.notice.classList.add("show");
    this.noticeTimer = window.setTimeout(() => {
      this.dom.notice.classList.remove("show");
    }, 1800);
  }
}
