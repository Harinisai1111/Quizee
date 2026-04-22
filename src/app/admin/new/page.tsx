"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2, Save, ArrowLeft, CheckCircle2, Circle, Type, HelpCircle, Clock } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Question {
  type: "mcq" | "tf";
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

export default function QuizBuilder() {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const addQuestion = (type: "mcq" | "tf") => {
    const newQuestion: Question = {
      type,
      text: "",
      options: type === "mcq" ? ["", "", "", ""] : ["True", "False"],
      correctIndex: 0,
      timeLimit: 20,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title) return alert("Please enter a quiz title");
    if (questions.length === 0) return alert("Please add at least one question");

    setSaving(true);
    const { error } = await supabase.from("quizzes").insert({
      creator_id: user?.id,
      title,
      description,
      questions,
    });

    if (error) {
      alert("Error saving quiz: " + error.message);
    } else {
      router.push("/admin");
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-background text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button 
            variant="primary" 
            className="gap-2 px-8" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Quiz"}
          </Button>
        </div>

        {/* Quiz Info */}
        <div className="space-y-6">
          <Input 
            label="Quiz Title" 
            placeholder="e.g. World History Trivia" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-black font-heading italic h-16"
          />
          <Input 
            label="Description (Optional)" 
            placeholder="A short description about this quiz" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Questions List */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black font-heading italic tracking-tight uppercase">
              Questions <span className="text-primary ml-2">{questions.length}</span>
            </h2>
          </div>

          <AnimatePresence>
            {questions.map((q, qIndex) => (
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card glass className="p-8 relative border-white/5 hover:border-white/20 transition-all">
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-background">
                    {qIndex + 1}
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        <Input 
                          placeholder="Enter your question here..." 
                          value={q.text}
                          onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                          className="bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 px-0 h-10 text-xl font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="relative group">
                            <div className={cn(
                              "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                              q.correctIndex === oIndex 
                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,229,200,0.2)]" 
                                : "border-white/5 bg-white/5 hover:border-white/20"
                            )}
                            onClick={() => updateQuestion(qIndex, { correctIndex: oIndex })}
                            >
                              {q.correctIndex === oIndex ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-white/20" />
                              )}
                              <input 
                                className="bg-transparent border-0 focus:ring-0 text-white font-medium flex-1"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[oIndex] = e.target.value;
                                  updateQuestion(qIndex, { options: newOpts });
                                }}
                                placeholder={`Option ${oIndex + 1}`}
                                disabled={q.type === 'tf'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full md:w-48 space-y-4 pt-4 border-t md:border-t-0 md:pt-0 md:pl-8 md:border-l border-white/10">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Time Limit
                        </label>
                        <select 
                          className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all text-white"
                          value={q.timeLimit}
                          onChange={(e) => updateQuestion(qIndex, { timeLimit: parseInt(e.target.value) })}
                        >
                          <option value={10} className="bg-slate-900 text-white">10 Seconds</option>
                          <option value={20} className="bg-slate-900 text-white">20 Seconds</option>
                          <option value={30} className="bg-slate-900 text-white">30 Seconds</option>
                          <option value={0} className="bg-slate-900 text-white">No Limit</option>
                        </select>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-red-500 hover:bg-red-500/10 justify-start"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Question Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
            <button 
              onClick={() => addQuestion("mcq")}
              className="flex items-center gap-4 p-8 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-heading italic">Add MCQ</h4>
                <p className="text-sm text-white/40">Multiple choice question with 4 options.</p>
              </div>
            </button>

            <button 
              onClick={() => addQuestion("tf")}
              className="flex items-center gap-4 p-8 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-secondary/50 hover:bg-secondary/5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-heading italic">Add True/False</h4>
                <p className="text-sm text-white/40">Simple binary choice question.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
