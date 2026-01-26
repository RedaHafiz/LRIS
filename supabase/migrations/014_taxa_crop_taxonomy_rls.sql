-- Enable Row Level Security on Taxa table (crop taxonomy)
ALTER TABLE public."Taxa" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view crop taxonomy
CREATE POLICY "All authenticated users can view crop taxonomy"
  ON public."Taxa" FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can add new crop taxonomy entries
CREATE POLICY "Authenticated users can add crop taxonomy"
  ON public."Taxa" FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update crop taxonomy
CREATE POLICY "Authenticated users can update crop taxonomy"
  ON public."Taxa" FOR UPDATE
  TO authenticated
  USING (true);
