import React, { useState, useEffect } from "react";
import { AlertCircle, Loader, CheckCircle2, Copy } from "lucide-react";

interface SolutionBoxProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  onClose: () => void;
}

export default function SolutionBox({
  question,
  userAnswer,
  correctAnswer,
  onClose,
}: SolutionBoxProps) {
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSolution = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/warroom/ai-guidance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "solution",
            question,
            userAnswer,
            correctAnswer,
          }),
        });

        if (!response.ok) throw new Error("Failed to get solution");

        const data = await response.json();
        setSolution(
          typeof data.response === "string" && data.response.trim()
            ? data.response.trim()
            : `The correct answer is "${correctAnswer}". Review why containment and evidence preservation matter here.`
        );
      } catch (err) {
        setError(null);
        setSolution(
          `The correct answer is "${correctAnswer}". Your answer "${userAnswer || "none"}" missed the safest IR step.`
        );
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolution();
  }, [question, userAnswer, correctAnswer]);

  const handleCopy = () => {
    if (solution) {
      navigator.clipboard.writeText(solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between border-b border-orange-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Solution Explanation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-orange-700 p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Question Context */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">Question:</p>
            <p className="text-gray-900 font-medium">{question}</p>
          </div>

          {/* Your Answer */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">Your Answer:</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-gray-900">{userAnswer || "No answer provided"}</p>
            </div>
          </div>

          {/* Correct Answer */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">Correct Answer:</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-900">{correctAnswer}</p>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Why This Matters:</h3>
              {solution && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-blue-700">Generating explanation...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {solution && !isLoading && (
              <div className="prose prose-sm max-w-none text-gray-900">
                <p className="whitespace-pre-wrap leading-relaxed">{solution}</p>
              </div>
            )}
          </div>

          {/* Key Takeaway */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-medium mb-2">💡 Key Takeaway:</p>
            <p className="text-sm text-amber-800">
              Make sure you understand the core concept here. This type of question might appear
              again in future simulations!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
