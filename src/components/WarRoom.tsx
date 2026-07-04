"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ScenarioNode {
  id: string;
  status: "critical" | "warning" | "online";
}

interface ScenarioInject {
  time: number;
  message: string;
  severity: "critical" | "warning" | "info";
}

interface ScenarioQuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

interface ScenarioQuestion {
  question: string;
  options: ScenarioQuestionOption[];
  context: string;
  nist_phase: string;
}

interface Scenario {
  id: string;
  title: string;
  briefing: string;
  attack_type: string;
  nodes: ScenarioNode[];
  injects: ScenarioInject[];
  nist_phases: string[];
}

interface FeedItem {
  id: string;
  timestamp: string;
  message: string;
  severity: "critical" | "warning" | "info" | "system";
}

interface AiFeedback {
  score: number;
  verdict: string;
  nist_phase: string;
  reasoning: string;
  correct_approach: string;
  points: number;
}

interface WarRoomProps {
  scenario: Scenario;
}

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

const stripBackticks = (text: string) => text.replace(/`+/g, "");

function getSeverityClasses(severity: FeedItem["severity"]) {
  switch (severity) {
    case "critical":
      return "text-red-300";
    case "warning":
      return "text-amber-300";
    case "info":
      return "text-cyan-300";
    default:
      return "text-slate-400";
  }
}

function getNodeClasses(status: ScenarioNode["status"]) {
  switch (status) {
    case "critical":
      return "border-red-500 bg-red-600/10 text-red-300";
    case "warning":
      return "border-amber-500 bg-amber-600/10 text-amber-300";
    default:
      return "border-cyan-500 bg-cyan-600/10 text-cyan-300";
  }
}

export default function WarRoom({ scenario }: WarRoomProps) {
  const router = useRouter();

  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<ScenarioQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<ScenarioQuestionOption | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [answerHistory, setAnswerHistory] = useState<
    Array<{ isCorrect: boolean; question: string; selectedOption: string; nistPhase: string }>
  >([]);
  const totalQuestions = scenario.nist_phases.length;
  const [previousQuestion, setPreviousQuestion] = useState<string | null>(null);
  const [previousAnswer, setPreviousAnswer] = useState<string | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: "system-1",
      timestamp: formatTimestamp(new Date()),
      message: "War Room online. Monitoring the incident.",
      severity: "system",
    },
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const injectCursorRef = useRef(0);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const nistPhaseScores = useMemo(
    () => scenario.nist_phases.map((phase, index) => ({
      phase,
      score: scores[index] ?? 0,
    })),
    [scenario.nist_phases, scores]
  );

  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    sessionStorage.setItem("war_room_session_id", newSessionId);
    setSessionId(newSessionId);
  }, [scenario.id]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [feedItems]);

  const appendFeed = useCallback((message: string, severity: FeedItem["severity"]) => {
    setFeedItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        timestamp: formatTimestamp(new Date()),
        message,
        severity,
      },
    ]);
  }, []);

  const generateQuestion = useCallback(async (
    qNum: number,
    prevQ: string | null,
    prevA: string | null,
    prevS: number | null
  ) => {
    setIsGenerating(true);
    setAiFeedback(null);
    setSelectedOption(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle: scenario.title,
          scenarioBriefing: scenario.briefing,
          attackType: scenario.attack_type,
          nistPhase: scenario.nist_phases[qNum - 1] ?? scenario.nist_phases[0],
          questionNumber: qNum,
          previousQuestion: prevQ,
          previousAnswer: prevA,
          previousScore: prevS,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generate request failed: ${response.status}`);
      }

      const data = await response.json();
      const question: ScenarioQuestion = {
        question: data.question,
        context: data.context,
        options: data.options,
        nist_phase: data.nist_phase,
      };

      setCurrentQuestion(question);
      appendFeed(`AI: ${stripBackticks(question.context)}`, "info");
    } catch (error) {
      console.error(error);
      appendFeed("AI generation failed. Please try again.", "critical");
    } finally {
      setIsGenerating(false);
    }
  }, [scenario, appendFeed]);

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedOption) return;

    setIsEvaluating(true);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle: scenario.title,
          scenarioBriefing: scenario.briefing,
          question: currentQuestion.question,
          nistPhase: currentQuestion.nist_phase,
          selectedOption: selectedOption.id,
          isCorrect: selectedOption.correct,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.status}`);
      }

      const result: AiFeedback = await response.json();
      setAiFeedback(result);
      setScores((prev) => [...prev, result.score]);
      setAnswerHistory((prev) => [
        ...prev,
        {
          isCorrect: selectedOption.correct,
          question: currentQuestion.question,
          selectedOption: selectedOption.text,
          nistPhase: currentQuestion.nist_phase,
        },
      ]);
      setPreviousQuestion(currentQuestion.question);
      setPreviousAnswer(selectedOption.text);
      setPreviousScore(result.score);
      appendFeed(`Evaluator: ${result.verdict} — ${result.reasoning}`, "info");
    } catch (error) {
      console.error(error);
      appendFeed("Evaluation failed. Please try again.", "critical");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    if (questionNumber < totalQuestions) {
      const nextQuestionNumber = questionNumber + 1;
      setQuestionNumber(nextQuestionNumber);
      setAiFeedback(null);
      setCurrentQuestion(null);
      setSelectedOption(null);
      generateQuestion(nextQuestionNumber, previousQuestion, previousAnswer, previousScore);
    } else {
      setGameOver(true);
      const encodedAnswers = encodeURIComponent(JSON.stringify(answerHistory));
      const encodedScores = encodeURIComponent(JSON.stringify(scores));
      const encodedTitle = encodeURIComponent(scenario.title);
      const encodedPhases = encodeURIComponent(JSON.stringify(scenario.nist_phases));
      const encodedScenarioId = encodeURIComponent(scenario.id);
      const encodedSessionId = encodeURIComponent(sessionId || sessionStorage.getItem("war_room_session_id") || "");
      router.push(
        `/results?answers=${encodedAnswers}&scores=${encodedScores}&scenarioId=${encodedScenarioId}&scenarioTitle=${encodedTitle}&nistPhases=${encodedPhases}&sessionId=${encodedSessionId}`
      );
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      generateQuestion(1, null, null, null);
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [scenario, generateQuestion]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const cursor = injectCursorRef.current;
      if (cursor >= scenario.injects.length) return;
      const nextInject = scenario.injects[cursor];
      injectCursorRef.current = cursor + 1;
      appendFeed(nextInject.message, nextInject.severity);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [scenario.injects, appendFeed]);

  const currentPhaseLabel = currentQuestion ? currentQuestion.nist_phase : scenario.nist_phases[questionNumber - 1];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)_180px]">
        <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Incident Feed
          </h2>
          <div ref={feedRef} className="space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-5 text-slate-300" style={{ maxHeight: 660 }}>
            {feedItems.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">{item.timestamp}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${getSeverityClasses(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-sm leading-snug">{item.message}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/80">War Room</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{scenario.title}</h1>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-cyan-200">
              Question {questionNumber} / {totalQuestions}
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-black/40 p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-300">Scenario Briefing</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">{scenario.briefing}</p>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-black/40 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                {currentPhaseLabel}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Attack: {scenario.attack_type}</span>
            </div>

            {isGenerating ? (
              <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-8 text-center text-lg font-semibold text-cyan-100">
                AI GENERATING SCENARIO...
              </div>
            ) : currentQuestion ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{currentQuestion.question}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{currentQuestion.context}</p>
                </div>

                {!aiFeedback ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedOption(option)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedOption?.id === option.id ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}
                      >
                        <div className="flex items-center gap-3 text-sm font-semibold text-white">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-cyan-300">{option.id.toUpperCase()}</span>
                          {option.text}
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!selectedOption || isEvaluating}
                      className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isEvaluating ? "Evaluating..." : "Submit Answer"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">Result</p>
                        <h3 className="mt-2 text-3xl font-bold text-white">{aiFeedback.score}/10</h3>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm uppercase tracking-[0.2em] text-cyan-200">
                        {aiFeedback.verdict}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-slate-300">{aiFeedback.reasoning}</p>
                    <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
                      <p className="font-semibold text-cyan-200">Correct approach</p>
                      <p className="mt-2">{aiFeedback.correct_approach}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                    >
                      {questionNumber < 4 ? "Next Question" : "View Results"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-400">
                Waiting for the next decision prompt.
              </div>
            )}
          </div>
        </main>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-300">Network Nodes</h2>
            <div className="mt-4 space-y-3">
              {scenario.nodes.map((node) => (
                <div key={node.id} className={`rounded-3xl border px-4 py-3 ${getNodeClasses(node.status)}`}>
                  <p className="text-sm font-mono font-semibold uppercase tracking-[0.18em]">{node.id}</p>
                  <p className="mt-1 text-xs text-slate-300">{node.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-300">NIST Phase Scores</h2>
            <div className="mt-4 space-y-4">
              {nistPhaseScores.map(({ phase, score }) => {
                const width = Math.min(Math.max(score * 10, 10), 100);
                return (
                  <div key={phase}>
                    <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      <span>{phase}</span>
                      <span>{score}/10</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
