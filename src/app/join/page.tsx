"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Gamepad2, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Check if session exists and is in lobby status
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("id, status")
        .eq("code", sessionCode.toUpperCase())
        .single();

      if (sessionError || !session) {
        throw new Error("Invalid session code.");
      }

      if (session.status === "ended") {
        throw new Error("This quiz has already ended.");
      }

      // 2. Register student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .upsert({
          session_id: session.id,
          username: username,
          score: 0,
        })
        .select()
        .single();

      if (studentError) {
        if (studentError.code === "23505") {
          throw new Error("Username already taken in this session.");
        }
        throw studentError;
      }

      // 3. Store info and redirect
      localStorage.setItem("quizee_student_id", student.id);
      localStorage.setItem("quizee_username", username);
      localStorage.setItem("quizee_session_code", sessionCode.toUpperCase());
      
      router.push(`/session/${sessionCode.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="absolute top-8 left-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card glass className="space-y-8 p-10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black font-heading tracking-tight italic">
              JOIN <span className="text-primary">GAME</span>
            </h1>
            <p className="text-white/60 font-medium">Ready to show off your skills?</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Game Code"
                placeholder="e.g. KQ-4821"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-black tracking-widest uppercase"
                required
              />
              <Input
                label="Your Username"
                placeholder="Enter a cool name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 text-center font-medium"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="xl"
              className="w-full group"
              disabled={loading || !sessionCode || !username}
            >
              {loading ? (
                "Joining..."
              ) : (
                <>
                  Enter Arena
                  <Gamepad2 className="ml-2 w-6 h-6 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
