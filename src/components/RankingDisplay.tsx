import React from "react";
import {
  Trophy,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Award,
  Target,
} from "lucide-react";

interface RankingResult {
  total_score: number;
  accuracy_percentage: number;
  overall_rank: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  speed_score: number;
}

interface RankingDisplayProps {
  ranking: RankingResult;
  totalQuestions: number;
  onRetry?: () => void;
  onHome?: () => void;
}

export default function RankingDisplay({
  ranking,
  totalQuestions,
  onRetry,
  onHome,
}: RankingDisplayProps) {
  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case "expert":
        return { bg: "bg-purple-100", text: "text-purple-900", badge: "bg-purple-600" };
      case "advanced":
        return { bg: "bg-blue-100", text: "text-blue-900", badge: "bg-blue-600" };
      case "intermediate":
        return { bg: "bg-amber-100", text: "text-amber-900", badge: "bg-amber-600" };
      case "novice":
        return { bg: "bg-green-100", text: "text-green-900", badge: "bg-green-600" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-900", badge: "bg-gray-600" };
    }
  };

  const colors = getRankColor(ranking.overall_rank);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main Rank Card */}
      <div className={`${colors.bg} rounded-xl p-8 mb-8 text-center`}>
        <Trophy className={`h-16 w-16 ${colors.text} mx-auto mb-4`} />
        <h1 className={`text-4xl font-bold ${colors.text} mb-2`}>
          {ranking.overall_rank.toUpperCase()}
        </h1>
        <div className={`inline-block ${colors.badge} bg-opacity-80 text-white px-4 py-2 rounded-lg mb-4`}>
          Score: {ranking.total_score}/100
        </div>
        <p className={`${colors.text} text-lg font-medium`}>
          Accuracy: {ranking.accuracy_percentage.toFixed(1)}%
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Award className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium mb-1">Overall Score</p>
          <p className="text-3xl font-bold text-gray-900">
            {ranking.total_score}
            <span className="text-lg text-gray-500">/100</span>
          </p>
        </div>

        {/* Accuracy */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium mb-1">Accuracy</p>
          <p className="text-3xl font-bold text-gray-900">
            {ranking.accuracy_percentage.toFixed(0)}
            <span className="text-lg text-gray-500">%</span>
          </p>
        </div>

        {/* Speed */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium mb-1">Speed Score</p>
          <p className="text-3xl font-bold text-gray-900">
            {ranking.speed_score}
            <span className="text-lg text-gray-500">%</span>
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Your Strengths
          </h3>
          {ranking.strengths && ranking.strengths.length > 0 ? (
            <ul className="space-y-2">
              {ranking.strengths.map((strength, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Keep practicing to identify strengths!</p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Areas for Improvement
          </h3>
          {ranking.weaknesses && ranking.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {ranking.weaknesses.map((weakness, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <span className="text-red-600 font-bold mt-0.5">→</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Excellent! No major weaknesses identified.</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recommendations for Next Time
        </h3>
        <p className="text-blue-800 text-sm leading-relaxed">
          {ranking.recommendations}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Try Another Simulation
          </button>
        )}
        {onHome && (
          <button
            onClick={onHome}
            className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Back to Training
          </button>
        )}
      </div>
    </div>
  );
}
