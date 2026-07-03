export type ScorableAnswer = {
  isCorrect?: boolean;
  is_correct?: boolean;
  correct?: boolean;
  verdict?: string;
};

export function calculateOverallScore(answers: ScorableAnswer[]): number {
  const totalQuestions = answers.length;
  if (totalQuestions === 0) return 0;
  const correctCount = answers.filter(
    (a) => a.isCorrect || a.is_correct || a.correct || a.verdict === "Correct"
  ).length;
  return Math.round((correctCount / totalQuestions) * 100);
}

export function isCorrectScoreValue(score: number): boolean {
  return score === 10;
}
