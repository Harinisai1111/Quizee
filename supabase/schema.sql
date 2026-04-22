-- Cleanup (Optional: uncomment if you want to reset everything)
-- DROP TABLE IF EXISTS answers;
-- DROP TABLE IF EXISTS students;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS quizzes;
-- DROP TYPE IF EXISTS session_status;

-- Create Enum for Session Status (Check if exists first)
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('lobby', 'active', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  status session_status DEFAULT 'lobby',
  current_question_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  socket_id TEXT,
  UNIQUE(session_id, username)
);

-- Answers Table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Quizzes Policies (Hosts can manage their own quizzes)
DROP POLICY IF EXISTS "Hosts can manage their own quizzes" ON quizzes;
CREATE POLICY "Hosts can manage their own quizzes" ON quizzes
  FOR ALL USING (true);

-- Sessions Policies (Anyone can read sessions by code)
DROP POLICY IF EXISTS "Anyone can read sessions" ON sessions;
CREATE POLICY "Anyone can read sessions" ON sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts can manage sessions" ON sessions;
CREATE POLICY "Hosts can manage sessions" ON sessions
  FOR ALL USING (true);

-- Students Policies (Anyone can join a session)
DROP POLICY IF EXISTS "Anyone can join a session" ON students;
CREATE POLICY "Anyone can join a session" ON students
  FOR ALL USING (true);

-- Answers Policies (Students can submit answers)
DROP POLICY IF EXISTS "Students can submit answers" ON answers;
CREATE POLICY "Students can submit answers" ON answers
  FOR ALL USING (true);

-- Enable Realtime for relevant tables (Check if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE students;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE answers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
