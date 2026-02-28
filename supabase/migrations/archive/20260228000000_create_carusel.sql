-- carusel_posts: photo posts with Google Drive file references
CREATE TABLE public.carusel_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  caption text,
  drive_file_id text NOT NULL,
  original_filename text,
  mime_type text NOT NULL,
  file_size integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT carusel_posts_pkey PRIMARY KEY (id),
  CONSTRAINT carusel_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- carusel_likes: simple like toggle (no upvote/downvote)
CREATE TABLE public.carusel_likes (
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT carusel_likes_pkey PRIMARY KEY (post_id, user_id),
  CONSTRAINT carusel_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.carusel_posts(id),
  CONSTRAINT carusel_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- carusel_comments: comments on photo posts
CREATE TABLE public.carusel_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT carusel_comments_pkey PRIMARY KEY (id),
  CONSTRAINT carusel_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.carusel_posts(id),
  CONSTRAINT carusel_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
