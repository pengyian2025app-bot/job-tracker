-- offers 表 RLS 策略
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户只能看自己的 offer" ON offers;
CREATE POLICY "用户只能看自己的 offer" ON offers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户只能新增 offer" ON offers;
CREATE POLICY "用户只能新增 offer" ON offers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户只能修改 offer" ON offers;
CREATE POLICY "用户只能修改 offer" ON offers FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户只能删除 offer" ON offers;
CREATE POLICY "用户只能删除 offer" ON offers FOR DELETE USING (auth.uid() = user_id);
