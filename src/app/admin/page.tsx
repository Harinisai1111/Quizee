"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Play, Trash2, Edit3, Trophy, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("creator_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setQuizzes(data);
    }
    setLoading(false);
  };

  const createSession = async (quizId: string) => {
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        code: sessionCode,
        quiz_id: quizId,
        status: "lobby",
        current_question_index: 0,
      })
      .select()
      .single();

    if (!error) {
      router.push(`/admin/session/${sessionCode}`);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (!error) {
        setQuizzes(quizzes.filter(q => q.id !== id));
      }
    }
  };

  return (
    <main className="min-h-screen bg-background text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-heading tracking-tight italic">
                HOST <span className="text-primary">DASHBOARD</span>
              </h1>
              <p className="text-white/60 font-medium">Welcome back, {user?.firstName || "Host"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>

        {/* Stats Summary (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card glass className="p-8 space-y-2 border-primary/20">
            <Trophy className="w-8 h-8 text-primary mb-2" />
            <div className="text-4xl font-black font-heading">{quizzes.length}</div>
            <div className="text-white/60 font-semibold uppercase tracking-wider text-xs">Total Quizzes</div>
          </Card>
          {/* Add more stats here if needed */}
        </div>

        {/* Quizzes List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black font-heading italic tracking-tight underline decoration-primary decoration-4 underline-offset-8">
              YOUR QUIZZES
            </h2>
            <Link href="/admin/new">
              <Button variant="primary" className="gap-2">
                <Plus className="w-5 h-5" />
                Create New
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <Card glass className="p-20 text-center space-y-4 border-dashed">
              <div className="text-white/20 flex justify-center">
                <Edit3 className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-bold font-heading">No quizzes yet</h3>
              <p className="text-white/40">Create your first quiz to start hosting sessions!</p>
              <Link href="/admin/new">
                <Button variant="outline">Create a Quiz</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card glass className="group relative h-full flex flex-col p-8 rounded-[2rem] hover:border-primary/40 transition-all overflow-hidden">
                    <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                          {quiz.questions?.length || 0}Q
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="p-2 h-auto text-white/40 hover:text-red-500" onClick={() => deleteQuiz(quiz.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold font-heading group-hover:text-primary transition-colors">{quiz.title}</h3>
                        <p className="text-white/60 line-clamp-2 text-sm mt-1">{quiz.description}</p>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <Button 
                        variant="primary" 
                        className="w-full gap-2 group/btn"
                        onClick={() => createSession(quiz.id)}
                      >
                        <Play className="w-4 h-4 fill-current group-hover/btn:translate-x-1 transition-transform" />
                        Host Now
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
