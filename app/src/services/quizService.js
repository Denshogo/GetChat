import { SUBJECTS } from "../constants.js";
import { createId, normalizeTopic } from "../utils.js";
import { getSubjectProfile } from "./subjectProfiles.js";

const QUIZ_BANK = [
  {
    subject: "民法",
    topic: "代理",
    question:
      "AはBに代理権を与えていたが、代理権の範囲外の契約をBがCと締結した。次のうち、原則として正しいものはどれか。",
    choices: [
      "本人Aは常に契約の効果を受ける。",
      "Bが無権代理人となる可能性があり、本人Aの追認の有無が問題となる。",
      "Cが悪意でも常に表見代理が成立する。",
      "追認がなくてもBに民法117条責任は発生しない。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "代理権の範囲外行為は無権代理となり、本人の追認の有無が先に検討対象です。追認がなければ無権代理人の責任（民法117条）が問題になります。",
  },
  {
    subject: "民法",
    topic: "表見代理",
    question:
      "表見代理（民法109条等）に関する記述として、最も適切なものはどれか。",
    choices: [
      "相手方が悪意でも、外観があれば常に成立する。",
      "本人の関与により外観が作出され、相手方が善意無過失なら成立し得る。",
      "本人の関与は不要で、代理人の主張のみで成立する。",
      "一切の条文上要件はなく、信義則のみで判断される。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "表見代理では外観作出への本人関与と、相手方保護要件（善意無過失）が中心です。条文のどの類型かを分けると整理しやすくなります。",
  },
  {
    subject: "不動産登記法",
    topic: "登記申請情報",
    question:
      "不動産登記の申請に関する記述として、適切なものはどれか。",
    choices: [
      "登記原因証明情報は常に不要である。",
      "原則として、登記の目的・原因等の申請情報を特定して提出する。",
      "登記識別情報は制度上存在しない。",
      "代理申請は法律上一切認められていない。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "登記申請では、法令で求められる申請情報と添付情報を適切に特定することが基本です。必要書面の要否は登記の種類ごとに確認します。",
  },
  {
    subject: "商法・会社法",
    topic: "取締役会",
    question:
      "取締役会設置会社に関する記述として、最も適切なものはどれか。",
    choices: [
      "重要な業務執行の決定は常に株主総会が行う。",
      "取締役会は業務執行の決定と取締役の職務執行監督を行う。",
      "取締役会は取締役1名で構成できる。",
      "代表取締役は取締役会設置会社では存在しない。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "会社法上、取締役会は業務執行の決定権限と監督機能を持ちます。機関設計の比較問題では、株主総会との権限分配が頻出です。",
  },
  {
    subject: "民事訴訟法",
    topic: "既判力",
    question:
      "既判力についての説明として正しいものはどれか。",
    choices: [
      "確定判決には原則として既判力が生じない。",
      "既判力は、確定判決の判断内容について後訴での争いを制限する機能を持つ。",
      "既判力は当事者適格と無関係である。",
      "既判力は刑法分野の概念で民事訴訟法には存在しない。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "既判力は確定判決の拘束力として、後訴での蒸し返しを防ぐ役割を持ちます。主観的・客観的範囲をセットで押さえることが重要です。",
  },
  {
    subject: "憲法",
    topic: "人権制約",
    question:
      "憲法上の人権制約の審査に関する記述として、最も適切なものはどれか。",
    choices: [
      "いかなる場合も審査基準は一律である。",
      "制約される権利の性質や制約態様に応じて審査密度が調整される。",
      "公共の福祉は判例上考慮されない。",
      "違憲審査は立法機関のみが行う。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "判例・学説では、権利の重要性や制約態様に応じた審査基準の使い分けが論点になります。論証では目的手段審査の構造を明示してください。",
  },
  {
    subject: "刑法",
    topic: "故意",
    question:
      "刑法上の故意に関する説明として正しいものはどれか。",
    choices: [
      "故意は結果発生の認識がなくても常に認められる。",
      "構成要件該当事実の認識・認容が故意の中核となる。",
      "過失と故意は法的に同義である。",
      "故意犯処罰規定がなくても故意は必ず処罰される。",
    ],
    correctChoiceIndex: 1,
    explanation:
      "故意は構成要件事実の認識・認容が核です。未必の故意との区別は具体的事実の評価を丁寧に行うことが重要です。",
  },
];

function normalizeSubject(subject) {
  return SUBJECTS.includes(subject) ? subject : SUBJECTS[0];
}

function findCandidateByTopic(subject, topic) {
  const normalizedTopic = normalizeTopic(topic || "");
  if (!normalizedTopic) {
    return null;
  }

  const sameSubject = QUIZ_BANK.filter((quiz) => quiz.subject === subject);
  const exactMatched = sameSubject.find((quiz) => quiz.topic === normalizedTopic);
  if (exactMatched) {
    return exactMatched;
  }

  const matched = sameSubject.find((quiz) => normalizedTopic.includes(quiz.topic) || quiz.topic.includes(normalizedTopic));
  if (matched) {
    return matched;
  }

  const exactCrossSubject = QUIZ_BANK.find((quiz) => quiz.topic === normalizedTopic);
  if (exactCrossSubject) {
    return exactCrossSubject;
  }

  return QUIZ_BANK.find((quiz) => normalizedTopic.includes(quiz.topic) || quiz.topic.includes(normalizedTopic)) ?? null;
}

function pickRandomBySubject(subject) {
  const sameSubject = QUIZ_BANK.filter((quiz) => quiz.subject === subject);
  const pool = sameSubject.length > 0 ? sameSubject : QUIZ_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}

function createGenericQuiz(subject, topic) {
  const normalizedTopic = normalizeTopic(topic || "主要論点") || "主要論点";
  const profile = getSubjectProfile(subject);
  return {
    subject,
    topic: normalizedTopic,
    questionType: "multiple_choice",
    difficulty: 1,
    reference: `${subject} 基本条文`,
    question: `${subject}の「${normalizedTopic}」について、学習手順として最も適切なものを選びなさい。`,
    choices: [
      "条文を確認せず、いきなり過去問だけを繰り返す。",
      "結論だけ暗記し、理由や要件を確認しない。",
      "条文・要件・例外を順に整理し、最後に短い問題で確認する。",
      "苦手論点は記録せず、次に進む。",
    ],
    correctChoiceIndex: 2,
    explanation:
      `${subject}では「${profile.focus}」ことが重要です。条文と要件整理を先に行い、その後に問題演習で定着させてください。`,
  };
}

function hashText(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function createQuizKey(baseQuiz) {
  const seed = `${baseQuiz.subject}|${baseQuiz.topic}|${baseQuiz.question}`;
  return `quiz_${hashText(seed)}`;
}

function toQuizEntity(baseQuiz, { source, taskId }) {
  return {
    id: createId("quiz"),
    key: createQuizKey(baseQuiz),
    subject: baseQuiz.subject,
    topic: baseQuiz.topic,
    questionType: baseQuiz.questionType ?? "multiple_choice",
    difficulty: baseQuiz.difficulty ?? 1,
    reference: baseQuiz.reference ?? `${baseQuiz.subject} 基本条文`,
    question: baseQuiz.question,
    choices: baseQuiz.choices.map((text, index) => ({
      id: `choice_${index}`,
      text,
    })),
    correctChoiceId: `choice_${baseQuiz.correctChoiceIndex}`,
    explanation: baseQuiz.explanation,
    source,
    taskId: taskId ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function toQuizEntityFromApiResponse(response, { source = "chat", taskId = null } = {}) {
  const firstQuestion = response.questions?.[0];
  if (!firstQuestion) {
    throw new Error("API quiz response does not include questions[0]");
  }

  const baseQuiz = {
    subject: response.subject ?? "民法",
    topic: response.topic ?? "主要論点",
    questionType: firstQuestion.question_type ?? "multiple_choice",
    difficulty: Number(firstQuestion.difficulty ?? 1),
    reference: firstQuestion.reference ?? `${response.subject ?? "主要科目"} 基本条文`,
    question: firstQuestion.question_text,
    choices: (firstQuestion.choices ?? []).map((choice) => choice.text),
    correctChoiceIndex: Math.max(
      0,
      (firstQuestion.choices ?? []).findIndex((choice) => choice.choice_id === firstQuestion.correct_choice_id),
    ),
    explanation: firstQuestion.explanation,
  };

  const quiz = toQuizEntity(baseQuiz, { source, taskId });
  quiz.choices = (firstQuestion.choices ?? []).map((choice, index) => ({
    id: choice.choice_id ?? `choice_${index}`,
    text: choice.text ?? "",
  }));
  quiz.correctChoiceId = firstQuestion.correct_choice_id ?? quiz.choices[0]?.id ?? "A";
  quiz.reference = firstQuestion.reference ?? quiz.reference;
  quiz.questionType = firstQuestion.question_type ?? quiz.questionType;
  quiz.difficulty = Number(firstQuestion.difficulty ?? quiz.difficulty ?? 1);
  return quiz;
}

export class QuizService {
  generateQuiz({ subject, topic, source = "chat", taskId = null }) {
    const normalizedSubject = normalizeSubject(subject);
    const candidate = findCandidateByTopic(normalizedSubject, topic);

    if (candidate) {
      return toQuizEntity(candidate, { source, taskId });
    }

    const genericQuiz = createGenericQuiz(normalizedSubject, topic);
    return toQuizEntity(genericQuiz, { source, taskId });
  }

  generateRandomQuiz({ subject }) {
    const normalizedSubject = normalizeSubject(subject);
    const random = pickRandomBySubject(normalizedSubject);
    return toQuizEntity(random, { source: "random", taskId: null });
  }
}
