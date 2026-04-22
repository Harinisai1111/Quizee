# Quizee - Real-Time Quiz Platform

Quizee is a high-energy, Kahoot-inspired real-time MCQ platform built with Next.js, Supabase, and Clerk.

## 🚀 Features

- **Admin Dashboard**: Create quizzes with multiple choice or True/False questions.
- **Real-Time Sessions**: Host live sessions with unique game codes.
- **Interactive Player Experience**: Students join via mobile or desktop and answer questions as they appear on the host's screen.
- **Live Analytics**: Real-time bar graphs showing answer distribution.
- **Gamified Scoring**: Points based on correctness and speed.
- **Leaderboard**: Live rankings after each question and final standings.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: Next.js API Routes (Serverless).
- **Database**: Supabase (PostgreSQL).
- **Real-Time**: Supabase Realtime Channels.
- **Authentication**: Clerk.
- **Charts**: Recharts.

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase Project
- Clerk Account

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup
Run the SQL script found in `supabase/schema.sql` in your Supabase SQL Editor to create the necessary tables and enable Realtime.

### 4. Installation
```bash
npm install
```

### 5. Run Locally
```bash
npm run dev
```

## 🎨 Aesthetic
- **Theme**: Dark mode by default (#0d0f1a).
- **Accents**: Electric Teal (#00e5c8) and Hot Magenta (#ff3da0).
- **Typography**: Syne for headings, DM Sans for body.
