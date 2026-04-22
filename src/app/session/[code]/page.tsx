"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Trophy, Timer, CheckCircle2, XCircle, Gamepad2, Loader2, Star, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StudentSession() {
  const { code } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const studentId = localStorage.getItem("quizee_student_id");
    if (!studentId) {
      router.push("/join");
      return;
    }

    fetchInitialData(studentId);

    // Subscribe to session updates
    const sessionSub = supabase
      .channel(`session_student:${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `code=eq.${code}` }, (payload) => {
        const newSession = payload.new as any;
        setSession((prev: any) => {
          // If question changed, reset answering state
          if (prev && newSession.current_question_index !== prev.current_question_index) {
            setHasAnswered(false);
            setLastResult(null);
          }
          return newSession;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSub);
    };
  }, [code]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (session?.status === "active" && !hasAnswered && session?.current_question_started_at) {
      const currentQ = quiz?.questions[session.current_question_index];
      const timeLimit = currentQ?.timeLimit || 0;
      
      if (timeLimit > 0) {
        const calculateTimeLeft = () => {
          const startedAt = new Date(session.current_question_started_at).getTime();
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startedAt) / 1000);
          const remaining = Math.max(0, timeLimit - elapsed);
          setTimeLeft(remaining);
          return remaining;
        };

        const initialRemaining = calculateTimeLeft();
        if (initialRemaining > 0) {
          timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (remaining <= 0) {
              clearInterval(timer);
            }
          }, 1000);
        }
      } else {
        setTimeLeft(null);
      }
    }
    return () => clearInterval(timer);
  }, [session?.current_question_index, session?.status, session?.current_question_started_at, hasAnswered, quiz]);

  const [allStudents, setAllStudents] = useState<any[]>([]);

  const fetchInitialData = async (studentId: string) => {
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("*, quizzes(*)")
      .eq("code", code)
      .single();

    if (sessionData) {
      setSession(sessionData);
      setQuiz(sessionData.quizzes);
      
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();
      
      if (studentData) {
        setStudent(studentData);
      }

      if (sessionData.status === "ended") {
        fetchAllStudents(sessionData.id);
      }
    }
    setLoading(false);
  };

  const fetchAllStudents = async (sessionId: string) => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("session_id", sessionId)
      .order("score", { ascending: false });
    if (data) setAllStudents(data);
  };

  useEffect(() => {
    if (session?.status === "ended") {
      fetchAllStudents(session.id);
    }
  }, [session?.status]);

  const submitAnswer = async (index: number) => {
    if (hasAnswered || timeLeft === 0) return;

    setHasAnswered(true);
    const currentQ = quiz.questions[session.current_question_index];
    const isCorrect = index === currentQ.correctIndex;
    
    // Calculate score (Base 1000 for correct + up to 500 for speed)
    let points = isCorrect ? 1000 : 0;
    if (isCorrect && timeLeft !== null) {
      points += Math.floor((timeLeft / currentQ.timeLimit) * 500);
    }

    const timeTaken = quiz.questions[session.current_question_index].timeLimit - (timeLeft || 0);

    await supabase.from("answers").insert({
      session_id: session.id,
      student_id: student.id,
      question_index: session.current_question_index,
      selected_index: index,
      is_correct: isCorrect,
      time_taken: timeTaken,
    });

    if (isCorrect) {
      const { data: updatedStudent } = await supabase
        .from("students")
        .update({ score: student.score + points })
        .eq("id", student.id)
        .select()
        .single();
      
      if (updatedStudent) setStudent(updatedStudent);
    }

    setLastResult({ isCorrect, points });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!session) return <div className="min-h-screen bg-background flex items-center justify-center text-white text-center p-8"><h1 className="text-2xl font-bold mb-4">Session Not Found</h1><p className="text-white/60">Please check the code and try again.</p></div>;

  const currentQuestion = quiz?.questions[session.current_question_index];
  const COLORS = ["#00e5c8", "#ff3da0", "#f59e0b", "#8b5cf6"];

  return (
    <main className="min-h-screen bg-background text-white p-6 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {/* Lobby / Waiting State */}
        {session.status === "lobby" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Gamepad2 className="w-24 h-24 text-primary mx-auto relative animate-bounce" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black font-heading italic tracking-tight">YOU'RE <span className="text-primary">IN!</span></h1>
              <p className="text-xl font-medium text-white/60">Waiting for the host to start...</p>
            </div>
            <Card glass className="p-6 inline-flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {student?.username?.[0].toUpperCase()}
              </div>
              <span className="text-lg font-bold">{student?.username}</span>
            </Card>
          </motion.div>
        )}

        {/* Active Question State */}
        {session.status === "active" && !hasAnswered && (
          <motion.div
            key="question"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 font-bold text-sm">
                Q{session.current_question_index + 1} / {quiz.questions.length}
              </div>
              {timeLeft !== null && (
                <div className={cn(
                  "flex items-center gap-2 font-black font-heading text-3xl italic",
                  timeLeft < 5 ? "text-secondary animate-pulse" : "text-primary"
                )}>
                  <Timer className="w-8 h-8" /> {timeLeft}
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black font-heading italic text-center leading-tight">
              {currentQuestion.text}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
              {currentQuestion.options.map((opt: string, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submitAnswer(i)}
                  className="group relative overflow-hidden p-8 rounded-3xl text-left border-b-8 border-black/20 transition-all hover:brightness-110 active:border-b-0 active:translate-y-2"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
                      {opt}
                    </span>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Star className="w-16 h-16 fill-current text-white" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Answered State / Waiting for next question */}
        {session.status === "active" && hasAnswered && (
          <motion.div
            key="answered"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            {lastResult?.isCorrect ? (
              <div className="space-y-4">
                <CheckCircle2 className="w-24 h-24 text-primary mx-auto animate-bounce" />
                <h2 className="text-5xl font-black font-heading italic text-primary">CORRECT!</h2>
              </div>
            ) : (
              <div className="space-y-4">
                <XCircle className="w-24 h-24 text-secondary mx-auto" />
                <h2 className="text-5xl font-black font-heading italic text-secondary">NOT QUITE...</h2>
                <p className="text-white/60 font-medium">Keep going, you've got this!</p>
              </div>
            )}
            
            <Card glass className="p-8 space-y-4 max-w-sm mx-auto">
              {/* Points hidden as per user request */}
              <p className="text-sm text-white/40 italic">Waiting for host to move to next question...</p>
            </Card>
          </motion.div>
        )}

        {/* Ended State */}
        {session.status === "ended" && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-lg w-full pb-12"
          >
            <div className="space-y-2">
              <Trophy className="w-20 h-20 text-amber mx-auto drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              <h1 className="text-5xl font-black font-heading italic tracking-tighter uppercase">Leaderboard</h1>
            </div>

            <div className="space-y-3">
              {allStudents.slice(0, 5).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-6 rounded-3xl border-b-4 border-black/20 transition-all",
                    s.id === student?.id ? "bg-primary text-background scale-105 z-10" : "bg-white/5 text-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black italic opacity-60">#{i + 1}</span>
                    <span className="text-xl font-bold">{s.username}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {!allStudents.find((s, i) => i < 5 && s.id === student?.id) && student && (
              <div className="pt-4">
                <div className="text-white/40 uppercase text-xs font-black tracking-widest mb-2">Your Ranking</div>
                <Card glass className="flex items-center justify-between p-6 border-primary/20">
                   <div className="flex items-center gap-4">
                    <span className="text-xl font-black italic opacity-60">#{allStudents.findIndex(s => s.id === student.id) + 1}</span>
                    <span className="text-xl font-bold">{student.username}</span>
                  </div>
                </Card>
              </div>
            )}

            <Button variant="outline" size="lg" className="w-full mt-8" onClick={() => router.push("/")}>
              Home
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
