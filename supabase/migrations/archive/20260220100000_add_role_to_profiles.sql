ALTER TABLE public.profiles ADD COLUMN role text NOT NULL DEFAULT 'user';
UPDATE public.profiles SET role = 'admin' WHERE username = 'victor';
