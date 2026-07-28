-- ========== 每日复盘 journals 表 ==========
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('great','good','ok','bad','awful')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_journals_user_date ON journals(user_id, date DESC);

-- RLS
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能看自己的
DROP POLICY IF EXISTS "用户只能看自己的复盘" ON journals;
CREATE POLICY "用户只能看自己的复盘"
ON journals FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能新增自己的复盘" ON journals;
CREATE POLICY "用户只能新增自己的复盘"
ON journals FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能修改自己的复盘" ON journals;
CREATE POLICY "用户只能修改自己的复盘"
ON journals FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能删除自己的复盘" ON journals;
CREATE POLICY "用户只能删除自己的复盘"
ON journals FOR DELETE
USING (auth.uid() = user_id);

-- updated_at 触发器（复用已有函数）
DROP TRIGGER IF EXISTS trigger_update_journals_updated_at ON journals;
CREATE TRIGGER trigger_update_journals_updated_at
BEFORE UPDATE ON journals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();