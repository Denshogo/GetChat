import { DEFAULT_SUBJECT, SUBJECTS } from "../constants.js";

const SUBJECT_PROFILES = {
  民法: {
    defaultKeywords: ["民法", "条文", "要件"],
    focus: "要件事実と例外要件を分けて整理する",
    reviewHint: "主要条文と判例フレーズをセットで復習する",
  },
  不動産登記法: {
    defaultKeywords: ["不動産登記法", "申請情報", "添付情報"],
    focus: "申請情報・添付情報・登記原因を区別して確認する",
    reviewHint: "登記目的別の必要書類を表で整理する",
  },
  "商法・会社法": {
    defaultKeywords: ["会社法", "機関設計", "決議要件"],
    focus: "機関ごとの権限配分を条文順で押さえる",
    reviewHint: "株式会社の機関類型を比較表で復習する",
  },
  民事訴訟法: {
    defaultKeywords: ["民事訴訟法", "既判力", "弁論主義"],
    focus: "手続段階と効果を混同せずに整理する",
    reviewHint: "訴訟要件・本案・効力を段階別で復習する",
  },
  民事執行法: {
    defaultKeywords: ["民事執行法", "差押え", "配当"],
    focus: "執行対象と執行手続の流れを先に把握する",
    reviewHint: "執行手続の時系列を図で復習する",
  },
  民事保全法: {
    defaultKeywords: ["民事保全法", "仮差押え", "仮処分"],
    focus: "保全命令の要件と本案訴訟との関係を確認する",
    reviewHint: "保全必要性の判断要素を短文で整理する",
  },
  供託法: {
    defaultKeywords: ["供託法", "弁済供託", "還付請求"],
    focus: "供託原因と手続主体を切り分ける",
    reviewHint: "供託原因ごとの効果を一覧で復習する",
  },
  司法書士法: {
    defaultKeywords: ["司法書士法", "業務範囲", "懲戒"],
    focus: "業務範囲と禁止行為を条文単位で整理する",
    reviewHint: "登録・監督・懲戒の流れを復習する",
  },
  憲法: {
    defaultKeywords: ["憲法", "人権", "違憲審査"],
    focus: "権利の性質ごとに審査基準を使い分ける",
    reviewHint: "判例の規範とあてはめパターンを復習する",
  },
  刑法: {
    defaultKeywords: ["刑法", "構成要件", "故意過失"],
    focus: "構成要件該当性→違法性→責任の順で確認する",
    reviewHint: "論点ごとに事実評価のポイントを整理する",
  },
};

export function getSubjectProfile(subject) {
  if (SUBJECT_PROFILES[subject]) {
    return SUBJECT_PROFILES[subject];
  }

  return SUBJECT_PROFILES[DEFAULT_SUBJECT];
}

export function getDefaultKeywordsForSubject(subject, topic = "主要論点") {
  const profile = getSubjectProfile(subject);
  return [subject || DEFAULT_SUBJECT, topic, ...profile.defaultKeywords].slice(0, 3);
}

export function isSupportedSubject(subject) {
  return SUBJECTS.includes(subject);
}
