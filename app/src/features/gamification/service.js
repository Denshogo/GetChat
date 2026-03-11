import { POINTS } from "../../constants.js";
import { getProgressToNextRank } from "../../services/rankService.js";

export class GamificationService {
  constructor({ progressRepository }) {
    this.progressRepository = progressRepository;
  }

  getProgressView() {
    const points = this.progressRepository.getPoints();
    const progress = getProgressToNextRank(points);
    const pointsToNextRank = progress.next
      ? Math.max(0, progress.next.minPoints - points)
      : 0;

    return {
      points,
      currentRank: progress.current,
      nextRank: progress.next,
      rate: progress.rate,
      pointsToNextRank,
      isMaxRank: !progress.next,
    };
  }

  awardFirstCorrect(quizKey) {
    const awarded = this.progressRepository.awardOnce(
      `quiz:${quizKey}:first_correct`,
      POINTS.FIRST_CORRECT,
    );

    return {
      awarded,
      points: POINTS.FIRST_CORRECT,
    };
  }

  awardExplanationAfterWrong(quizKey) {
    const awarded = this.progressRepository.awardOnce(
      `quiz:${quizKey}:explain_after_wrong`,
      POINTS.EXPLANATION_AFTER_WRONG,
    );

    return {
      awarded,
      points: POINTS.EXPLANATION_AFTER_WRONG,
    };
  }
}
