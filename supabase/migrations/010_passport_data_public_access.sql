-- Enable public read access to Passport Data table
-- This allows the query system to work without authentication

-- Enable RLS if not already enabled
ALTER TABLE public."Passport Data" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view passport data" ON public."Passport Data";
DROP POLICY IF EXISTS "Public read access to passport data" ON public."Passport Data";

-- Create public read policy
CREATE POLICY "Public read access to passport data"
  ON public."Passport Data"
  FOR SELECT
  TO public
  USING (true);

-- Optional: Allow authenticated users to insert/update/delete
CREATE POLICY "Authenticated users can insert passport data"
  ON public."Passport Data"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update passport data"
  ON public."Passport Data"
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete passport data"
  ON public."Passport Data"
  FOR DELETE
  TO authenticated
  USING (true);
