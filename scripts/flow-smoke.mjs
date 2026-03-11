const local = new Map();

globalThis.window = {
  localStorage: {
    getItem(key) {
      return local.has(key) ? local.get(key) : null;
    },
    setItem(key, value) {
      local.set(key, value);
    },
    removeItem(key) {
      local.delete(key);
    },
    clear() {
      local.clear();
    },
  },
};

const [{ detectIntent }, { QuizService }, { AiClient }, { ChatFeatureService }, { QUIZ_SET_STATUS, applyGradingResponse, createQuizSession, discardQuizSession }, { toActiveQuizData }, { TaskRepository }, { ProgressRepository }, { ConversationRepository }, { getProgressToNextRank }, { AiService }, { OpenAiStructuredProvider }, { LlmClient }] = await Promise.all([
  import("../app/src/services/intentService.js"),
  import("../app/src/services/quizService.js"),
  import("../app/src/services/aiClient.js"),
  import("../app/src/features/chat/service.js"),
  import("../app/src/features/quiz/sessionService.js"),
  import("../app/src/features/quiz/aiPayloadAdapter.js"),
  import("../app/src/repositories/taskRepository.js"),
  import("../app/src/repositories/progressRepository.js"),
  import("../app/src/repositories/conversationRepository.js"),
  import("../app/src/services/rankService.js"),
  import("../server/ai/service.js"),
  import("../server/ai/providers/openaiProvider.js"),
  import("../server/ai/llmClient.js"),
]);

const intent = detectIntent("表見代理の問題を出して");
if (intent.type !== "quiz_request" || intent.topic !== "表見代理") {
  throw new Error("intent detection failed");
}

const quizService = new QuizService();
const quiz = quizService.generateQuiz({ subject: "民法", topic: intent.topic, source: "chat" });
if (quiz.choices.length !== 4 || !quiz.correctChoiceId) {
  throw new Error("quiz generation failed");
}

const createdSet = createQuizSession(quiz);
if (createdSet.status !== QUIZ_SET_STATUS.PENDING || !createdSet.quizSetId || createdSet.questions.length !== 1) {
  throw new Error("quiz set creation failed");
}

const ai = new AiClient();
const reply = await ai.respond({ text: "代理の要件は？", subject: "民法", attachments: [] });
if (!reply.keywords?.length || !reply.conclusion || !reply.reason || !reply.topic) {
  throw new Error("ai response shape failed");
}

const chatFeature = new ChatFeatureService({
  aiClient: ai,
});

const quizModeResult = await chatFeature.handleUserInput({
  text: "表見代理",
  selectedSubject: "民法",
  selectedMode: "quiz",
  activeQuizSession: null,
});
if (quizModeResult.type !== "quiz_request" || !quizModeResult.quiz) {
  throw new Error("mode-based quiz routing failed");
}

const gradingResult = await chatFeature.handleUserInput({
  text: "2番",
  selectedSubject: "民法",
  selectedMode: "grading",
  activeQuizSession: createQuizSession(quiz),
});
if (gradingResult.type !== "grading_answered" || !gradingResult.assistantReply.conclusion) {
  throw new Error("mode-based grading routing failed");
}

const aiService = new AiService();
const explainApi = await aiService.execute({
  mode: "explain",
  subject: "民法",
  user_message: "無権代理を説明して",
  active_quiz_data: null,
});
if (!explainApi.explanation || explainApi.suggested_task_cards.length > 2) {
  throw new Error("api explain response failed");
}

const quizApi = await aiService.execute({
  mode: "quiz",
  subject: "民法",
  user_message: "表見代理の問題を1問作って",
  active_quiz_data: null,
});
if (!quizApi.questions?.[0]?.reference) {
  throw new Error("api quiz response failed");
}

const gradingSession = createQuizSession(quiz);
const gradingApi = await aiService.execute({
  mode: "grading",
  subject: "民法",
  user_message: "2番",
  active_quiz_data: toActiveQuizData(gradingSession),
});
if (!gradingApi.score_text || gradingApi.results.length !== 1) {
  throw new Error("api grading response failed");
}
applyGradingResponse(gradingSession, gradingApi, "2番");
if (gradingSession.status !== QUIZ_SET_STATUS.GRADED || !gradingSession.gradingResult) {
  throw new Error("api grading apply failed");
}

const freeApi = await aiService.execute({
  mode: "free",
  subject: "民法",
  user_message: "抵当権の問題を出して",
  active_quiz_data: null,
});
if (!freeApi.reply_text || !freeApi.suggested_action) {
  throw new Error("api free response failed");
}

const capturedOpenAiRequests = [];
const openaiProvider = new OpenAiStructuredProvider({
  apiKey: "test-key",
  client: {
    responses: {
      async create(request) {
        capturedOpenAiRequests.push(request);
        return {
          output_text: JSON.stringify({
            keywords: ["無権代理", "民法117条"],
            conclusion: "無権代理は追認の有無を先に確認します。",
            explanation: "効果帰属の有無を先に分けると整理しやすいです。",
            suggested_task_cards: ["無権代理 要件整理"],
          }),
        };
      },
    },
  },
});

const openaiExplain = await openaiProvider.generate({
  payload: {
    mode: "explain",
    subject: "民法",
    user_message: "無権代理を説明して",
    active_quiz_data: null,
  },
  systemPrompt: "system prompt",
  responseSchema: {
    name: "explain_response",
    schema: {
      type: "object",
    },
  },
});

if (openaiExplain.conclusion !== "無権代理は追認の有無を先に確認します。") {
  throw new Error("openai provider explain parse failed");
}

const openaiRequest = capturedOpenAiRequests[0];
if (
  !openaiRequest
  || openaiRequest.model !== "gpt-5-mini"
  || openaiRequest.instructions !== "system prompt"
  || openaiRequest.input !== "無権代理を説明して"
  || openaiRequest.text?.format?.type !== "json_schema"
) {
  throw new Error("openai provider request shape failed");
}

const openaiClient = new LlmClient({ provider: openaiProvider });
if (openaiClient.getProviderName() !== "openai") {
  throw new Error("openai provider name failed");
}

const blockedQuizResult = await chatFeature.handleUserInput({
  text: "無権代理",
  selectedSubject: "民法",
  selectedMode: "quiz",
  activeQuizSession: createQuizSession(quiz),
});
if (blockedQuizResult.type !== "blocked") {
  throw new Error("active quiz blocking failed");
}

const tasks = new TaskRepository();
const created = tasks.add("表見代理")?.task;
if (!created?.id) {
  throw new Error("task create failed");
}
tasks.setCompleted(created.id, true);
const afterComplete = tasks.findById(created.id);
if (!afterComplete?.is_completed) {
  throw new Error("task completion failed");
}

const progress = new ProgressRepository();
const conversations = new ConversationRepository();
const discardedSession = createQuizSession(quiz);
discardQuizSession(discardedSession);
if (discardedSession.status !== QUIZ_SET_STATUS.DISCARDED) {
  throw new Error("quiz set discard failed");
}

progress.awardOnce(`quiz:${quiz.key}:first_correct`, 5);
const points = progress.getPoints();
if (points !== 5) {
  throw new Error("point award failed");
}

const rank = getProgressToNextRank(points);
if (!rank.current?.name) {
  throw new Error("rank calculation failed");
}

const conversationSeed = conversations.ensureInitialized();
if (!conversationSeed.activeConversation?.conversation_id) {
  throw new Error("conversation init failed");
}
const createdConversation = conversations.createConversation();
if (createdConversation.conversations.length < 2) {
  throw new Error("conversation create failed");
}
const savedConversations = conversations.saveConversation({
  ...createdConversation.activeConversation,
  title: "抵当権の確認",
  messages: [{ role: "user", content: "抵当権を説明して" }],
});
const savedConversation = savedConversations.find(
  (conversation) => conversation.conversation_id === createdConversation.activeConversation.conversation_id,
);
if (savedConversation?.title !== "抵当権の確認") {
  throw new Error("conversation save failed");
}

console.log(
  JSON.stringify(
    {
      intent,
      quizTopic: quiz.topic,
      quizSetStatus: createdSet.status,
      replyKeywords: reply.keywords,
      gradingConclusion: gradingResult.assistantReply.conclusion,
      apiQuizTitle: quizApi.quiz_set_title,
      apiFreeAction: freeApi.suggested_action,
      openaiProviderModel: openaiRequest.model,
      blockedNotice: blockedQuizResult.notice,
      completedTask: afterComplete.title,
      points,
      rank: rank.current.name,
      conversationCount: savedConversations.length,
    },
    null,
    2,
  ),
);
