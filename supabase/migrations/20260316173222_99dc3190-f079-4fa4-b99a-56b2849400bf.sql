CREATE POLICY "Anyone can select express_analyses by session_id"
ON public.express_analyses
FOR SELECT
TO anon, authenticated
USING (true);