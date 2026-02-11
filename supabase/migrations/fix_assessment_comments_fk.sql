-- Add foreign key to profiles table
ALTER TABLE public.assessment_comments 
ADD CONSTRAINT assessment_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
