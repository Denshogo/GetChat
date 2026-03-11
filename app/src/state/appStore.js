import { DEFAULT_SUBJECT } from "../constants.js";

export class AppStore {
  constructor({
    tasks = [],
    messages = [],
    conversations = [],
    currentConversationId = null,
    selectedChatMode = null,
    currentQuizSession = null,
    selectedSubject = DEFAULT_SUBJECT,
  } = {}) {
    this.state = {
      selectedSubject,
      selectedChatMode,
      isTaskPanelOpen: false,
      isQuizModalOpen: false,
      isMenuOpen: false,
      isGuideModalOpen: false,
      isProgressModalOpen: false,
      tasks,
      messages,
      conversations,
      currentConversationId,
      currentQuizSession,
    };
  }

  getState() {
    return this.state;
  }

  setSelectedSubject(subject) {
    this.state.selectedSubject = subject;
  }

  setSelectedChatMode(mode) {
    this.state.selectedChatMode = mode;
  }

  toggleTaskPanel() {
    this.state.isTaskPanelOpen = !this.state.isTaskPanelOpen;
  }

  setTaskPanelOpen(isOpen) {
    this.state.isTaskPanelOpen = isOpen;
  }

  setMenuOpen(isOpen) {
    this.state.isMenuOpen = isOpen;
  }

  setGuideModalOpen(isOpen) {
    this.state.isGuideModalOpen = isOpen;
  }

  setProgressModalOpen(isOpen) {
    this.state.isProgressModalOpen = isOpen;
  }

  setTasks(tasks) {
    this.state.tasks = tasks;
  }

  setConversations(conversations) {
    this.state.conversations = conversations;
  }

  setCurrentConversationId(conversationId) {
    this.state.currentConversationId = conversationId;
  }

  addMessage(message) {
    this.state.messages = [...this.state.messages, message];
  }

  setMessages(messages) {
    this.state.messages = [...messages];
  }

  setCurrentQuizSession(session) {
    this.state.currentQuizSession = session;
  }

  clearCurrentQuizSession() {
    this.state.currentQuizSession = null;
  }

  setQuizModalOpen(isOpen) {
    this.state.isQuizModalOpen = isOpen;
  }
}
