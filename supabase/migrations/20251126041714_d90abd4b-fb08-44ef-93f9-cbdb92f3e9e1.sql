-- Create function to decrement user credits
CREATE OR REPLACE FUNCTION public.decrement_credits(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = GREATEST(credits - 1, 0)
  WHERE id = user_id;
END;
$$;