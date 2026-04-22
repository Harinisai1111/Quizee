"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { 
  Users, 
  Play, 
  ArrowRight, 
  Trophy, 
  CheckCircle2, 
  BarChart3, 
  Timer,
  Copy,
  Check,
  LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

export default function AdminSession() {
  const { code } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [allAnswers, setAllAnswers] = useState<any[]>([]);
  const [firstCorrect, setFirstCorrect] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [code]);

  useEffect(() => {
    if (!session?.id) return;

    // Subscribe to session updates
    const sessionSub = supabase
      .channel(`session:${code}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "sessions", 
        filter: `id=eq.${session.id}` 
      }, (payload) => {
        setSession(payload.new);
      })
      .subscribe();

    // Subscribe to student joins
    const studentSub = supabase
      .channel(`students:${code}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "students",
        filter: `session_id=eq.${session.id}`
      }, () => {
        fetchStudents(session.id);
      })
      .subscribe();

    // Subscribe to answers
    const answerSub = supabase
      .channel(`answers:${code}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "answers",
        filter: `session_id=eq.${session.id}`
      }, () => {
        fetchAnswers(session.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSub);
      supabase.removeChannel(studentSub);
      supabase.removeChannel(answerSub);
    };
  }, [session?.id, code, session?.current_question_index]);

  const fetchSession = async () => {
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*, quizzes(*)")
      .eq("code", code)
      .single();

    if (sessionData) {
      setSession(sessionData);
      setQuiz(sessionData.quizzes);
      fetchStudents(sessionData.id);
      fetchAnswers(sessionData.id, sessionData.current_question_index);
    }
    setLoading(false);
  };

  const fetchStudents = async (sessionId?: string) => {
    const id = sessionId || session?.id;
    if (!id) return;
    
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("session_id", id);
    if (data) setStudents(data);
  };

  const fetchAnswers = async (sessionId?: string, questionIndex?: number) => {
    const id = sessionId || session?.id;
    const index = questionIndex !== undefined ? questionIndex : session?.current_question_index;
    if (!id || index === undefined) return;

    const { data: currentData } = await supabase
      .from("answers")
      .select("*")
      .eq("session_id", id)
      .eq("question_index", index);
    
    const { data: sessionAllData } = await supabase
      .from("answers")
      .select("*")
      .eq("session_id", id);

    if (currentData) {
      setAnswers(currentData);
      // Find first correct answer for THIS question
      const correctOnes = currentData
        .filter((a: any) => a.is_correct)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      if (correctOnes.length > 0) {
        const studentId = correctOnes[0].student_id;
        const student = students.find(s => s.id === studentId);
        if (student) setFirstCorrect(student);
      } else {
        setFirstCorrect(null);
      }
    }

    if (sessionAllData) {
      setAllAnswers(sessionAllData);
    }
  };

  const startQuiz = async () => {
    await supabase
      .from("sessions")
      .update({ 
        status: "active", 
        current_question_index: 0,
        current_question_started_at: new Date().toISOString()
      })
      .eq("id", session.id);
  };

  const nextQuestion = async () => {
    const isLast = session.current_question_index === quiz.questions.length - 1;
    if (isLast) {
      await supabase
        .from("sessions")
        .update({ status: "ended" })
        .eq("id", session.id);
    } else {
      await supabase
        .from("sessions")
        .update({ 
          current_question_index: session.current_question_index + 1,
          current_question_started_at: new Date().toISOString()
        })
        .eq("id", session.id);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading session...</div>;
  if (!session) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Session not found.</div>;

  const currentQuestion = quiz?.questions[session.current_question_index];
  const chartData = currentQuestion?.options.map((opt: string, index: number) => ({
    name: opt,
    count: answers.filter(a => a.selected_index === index).length,
    isCorrect: index === currentQuestion.correctIndex
  }));

  const COLORS = ["#00e5c8", "#ff3da0", "#f59e0b", "#8b5cf6"];

  return (
    <main className="min-h-screen bg-background text-white p-6 md:p-12 overflow-hidden relative">
      {/* Lobby State */}
      {session.status === "lobby" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <span className="text-sm font-black font-heading tracking-[0.3em] text-primary uppercase opacity-60">Join the Arena</span>
          </div>
          
          <button 
            onClick={copyCode}
            className="group relative flex items-center gap-6 bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border-2 border-white/10 hover:border-primary/40 transition-all active:scale-95"
          >
            <h1 className="text-6xl md:text-8xl font-black font-heading tracking-tighter italic select-all">
              {code}
            </h1>
            <div className={cn(
              "p-4 rounded-2xl transition-all",
              copied ? "bg-primary text-background" : "bg-white/5 text-white/40 group-hover:text-primary group-hover:bg-primary/10"
            )}>
              {copied ? <Check className="w-8 h-8" /> : <Copy className="w-8 h-8" />}
            </div>
            
            {copied && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-primary font-bold text-sm tracking-widest uppercase"
              >
                Copied to clipboard!
              </motion.div>
            )}
          </button>

          <div className="text-white/40 font-bold tracking-widest uppercase text-sm">
            quizee.com/join
          </div>

          <Card glass className="p-10 space-y-8 w-full max-w-4xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black font-heading italic">{students.length} PLAYERS JOINED</h2>
              </div>
              <Button 
                variant="primary" 
                size="lg" 
                className="px-12" 
                disabled={students.length === 0}
                onClick={startQuiz}
              >
                START QUIZ <Play className="ml-2 w-5 h-5 fill-current" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-64 overflow-y-auto pr-4 scrollbar-hide">
              <AnimatePresence>
                {students.map((student, i) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center font-bold"
                  >
                    {student.username}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      )}

      {/* Active Question State */}
      {session.status === "active" && (
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-primary font-bold tracking-widest text-xs uppercase">Question {session.current_question_index + 1} of {quiz.questions.length}</h1>
              <h2 className="text-3xl font-black font-heading italic leading-tight">{currentQuestion.text}</h2>
            </div>
            <Button variant="secondary" onClick={nextQuestion}>
              {session.current_question_index === quiz.questions.length - 1 ? "Show Results" : "Next Question"} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Stats */}
            <Card glass className="lg:col-span-2 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/40 font-bold uppercase text-xs tracking-widest">
                  <BarChart3 className="w-4 h-4" /> Live Responses
                </div>
                <div className="text-primary font-black font-heading text-2xl italic">
                  {answers.length} / {students.length}
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1a1c2e", border: "none", borderRadius: "12px", color: "white" }}
                      itemStyle={{ color: "#00e5c8" }}
                    />
                    <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-medium text-white/60 truncate">{opt}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Leaderboard or Correct Answerers */}
            <Card glass className="p-8 space-y-6">
              <div className="flex items-center gap-2 text-white/40 font-bold uppercase text-xs tracking-widest">
                <Users className="w-4 h-4" /> Who's leading?
              </div>
              
              <div className="space-y-4">
                {students
                  .map(student => {
                    const studentAnswers = allAnswers.filter(a => a.student_id === student.id);
                    const correctCount = studentAnswers.filter(a => a.is_correct).length;
                    const totalTime = studentAnswers
                      .filter(a => a.is_correct)
                      .reduce((acc, a) => acc + (a.time_taken || 0), 0);
                    return { ...student, correctCount, totalTime };
                  })
                  .sort((a, b) => {
                    if (b.correctCount !== a.correctCount) {
                      return b.correctCount - a.correctCount;
                    }
                    return a.totalTime - b.totalTime;
                  })
                  .slice(0, 5)
                  .map((student, i) => (
                    <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-sm">
                          {i + 1}
                        </div>
                        <span className="font-bold">{student.username}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-60">
                        <span>{student.correctCount} Correct</span>
                        <span>{student.totalTime.toFixed(1)}s</span>
                      </div>
                    </div>
                  ))}
              </div>

              {firstCorrect && (
                <div className="pt-4 border-t border-white/10">
                  <div className="text-primary font-bold uppercase text-[10px] tracking-[0.2em] mb-2">🚀 Fastest Finger</div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
                      {firstCorrect.username[0].toUpperCase()}
                    </div>
                    <span className="font-bold text-primary">{firstCorrect.username}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Ended State */}
      {session.status === "ended" && (
        <div className="max-w-4xl mx-auto space-y-12 py-12">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <Trophy className="w-40 h-40 text-amber mx-auto drop-shadow-[0_0_50px_rgba(245,158,11,0.6)]" />
            </motion.div>
            <h1 className="text-5xl font-black font-heading italic tracking-tighter uppercase">Final Standings</h1>
            <p className="text-white/60 text-lg font-medium italic">Amazing job everyone! Here are the champions.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {students
              .map(student => {
                const studentAnswers = allAnswers.filter(a => a.student_id === student.id);
                const correctCount = studentAnswers.filter(a => a.is_correct).length;
                const totalTime = studentAnswers
                  .filter(a => a.is_correct)
                  .reduce((acc, a) => acc + (a.time_taken || 0), 0);
                return { ...student, correctCount, totalTime };
              })
              .sort((a, b) => {
                if (b.correctCount !== a.correctCount) {
                  return b.correctCount - a.correctCount;
                }
                return a.totalTime - b.totalTime;
              })
              .slice(0, 10)
              .map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-6 rounded-3xl border-b-4 border-black/20 transition-all",
                    i === 0 ? "bg-primary text-background scale-105 z-10" : 
                    i === 1 ? "bg-white/10 text-white border-white/20" :
                    i === 2 ? "bg-white/5 text-white/80 border-white/10" : "bg-white/5 text-white/60"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-2xl font-black italic opacity-40">#{i + 1}</span>
                    <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center text-xl font-black uppercase">
                      {s.username[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black font-heading italic">{s.username}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                        {s.correctCount} Correct in {s.totalTime.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
          
          <div className="flex justify-center pt-8">
            <Link href="/admin">
              <Button size="lg" variant="outline" className="px-12 py-8 rounded-full text-xl gap-4 hover:bg-white hover:text-background transition-colors">
                <LogOut className="w-8 h-8" /> Close Session
              </Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
