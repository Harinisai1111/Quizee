"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { UserButton, useUser } from "@clerk/nextjs";
import { Trophy, Play, Users, LayoutDashboard } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Header with User Info */}
      <div className="absolute top-8 right-8 z-20">
        {isSignedIn && (
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-2 pl-4 rounded-full border border-white/10">
            <span className="text-sm font-bold font-heading italic tracking-tight">DASHBOARD</span>
            <UserButton />
          </div>
        )}
      </div>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-4xl w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
            <Trophy className="w-5 h-5 text-amber" />
            <span className="text-sm font-semibold tracking-wide uppercase">The Ultimate Quiz Experience</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black font-heading tracking-tighter italic">
            QUIZ<span className="text-primary">EE</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto font-medium">
            Real-time interactive quizzes that turn learning into a high-energy game show.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Join Quiz Section */}
          <Link href="/join">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative h-full p-8 rounded-[2rem] bg-white/5 border-2 border-white/10 hover:border-primary/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-32 h-32 text-primary" />
              </div>
              <div className="relative z-10 text-left space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-3xl font-bold font-heading">Join a Quiz</h3>
                <p className="text-white/60 font-medium">
                  Enter a session code and compete against others in real-time.
                </p>
                <Button variant="primary" size="lg" className="w-full mt-4 group-hover:shadow-[0_0_30px_rgba(0,229,200,0.4)]">
                  Enter Game Code
                </Button>
              </div>
            </motion.div>
          </Link>

          {/* Host Quiz Section */}
          <Link href="/admin">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative h-full p-8 rounded-[2rem] bg-white/5 border-2 border-white/10 hover:border-secondary/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-32 h-32 text-secondary" />
              </div>
              <div className="relative z-10 text-left space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold font-heading">Host a Quiz</h3>
                <p className="text-white/60 font-medium">
                  Create your own questions and lead the session like a pro.
                </p>
                <Button variant="secondary" size="lg" className="w-full mt-4 group-hover:shadow-[0_0_30px_rgba(255,61,160,0.4)]">
                  Launch Dashboard
                </Button>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/30 text-sm font-medium"
        >
          Press <span className="px-2 py-1 rounded bg-white/10 text-white/50">H</span> to host or <span className="px-2 py-1 rounded bg-white/10 text-white/50">J</span> to join
        </motion.div>
      </div>
    </main>
  );
}
