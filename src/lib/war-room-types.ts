export interface AnswerFeedbackItem {
  question: string;
  user_answer: string;
  correct_answer: string;
  selected_option?: string;
  answer_mode: "mcq" | "text";
  is_correct: boolean;
  confidence_score: number;
  feedback: string;
  time_seconds: number;
}

export interface WarRoomEvaluation {
  score: number;
  total_score: number;
  accuracy_percentage: number;
  overall_rank: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  ranking_analysis?: string;
  speed_score: number;
  answer_feedback: AnswerFeedbackItem[];
}

export interface StoredAnswerRecord {
  questionId: string;
  question_text: string;
  correct_answer: string;
  user_answer: string;
  selected_option?: string;
  answer_mode: "mcq" | "text";
  timeSpent: number;
  isCorrect: boolean;
  feedback: string;
  confidence_score: number;
}
