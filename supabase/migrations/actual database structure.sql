-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcement_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcement_comments_pkey PRIMARY KEY (id),
  CONSTRAINT announcement_comments_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id),
  CONSTRAINT announcement_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.announcement_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote = ANY (ARRAY['-1'::integer, 1])),
  CONSTRAINT announcement_votes_pkey PRIMARY KEY (id),
  CONSTRAINT announcement_votes_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id),
  CONSTRAINT announcement_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  highschool text NOT NULL,
  content text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kanban_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'::text CHECK (status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text])),
  position integer NOT NULL DEFAULT 0,
  card_number integer NOT NULL DEFAULT nextval('kanban_cards_card_number_seq'::regclass),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false,
  CONSTRAINT kanban_cards_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT kanban_cards_created_by_profiles_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.post_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote = ANY (ARRAY['-1'::integer, 1])),
  CONSTRAINT post_votes_pkey PRIMARY KEY (id),
  CONSTRAINT post_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  highschool text NOT NULL,
  graduation_year integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  profession ARRAY,
  country text,
  city text,
  hobbies ARRAY,
  bio text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  domain ARRAY,
  avatar_url text,
  class text,
  company text,
  role text NOT NULL DEFAULT 'user'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.schools (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  an text,
  judet_pj text,
  localitate_pj text,
  cod_siruta_pj numeric,
  mediu_loc_pj text,
  cod_siiir_pj numeric,
  denumire_pj text,
  localitate_unitate text,
  cod_siruta_unitate numeric,
  mediu_loc_unitate text,
  cod_sirues text,
  cod_siiir_unitate numeric,
  denumire_scurta_unitate text,
  denumire_lunga_unitate text,
  tip_unitate text,
  statut_unitate text,
  cod_fiscal text,
  mod_functionare text,
  forma_finantare text,
  forma_proprietate text,
  strada text,
  numar text,
  cod_postal numeric,
  telefon numeric,
  fax numeric,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ziar_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  city text,
  county text,
  country text DEFAULT 'Romania'::text,
  category text NOT NULL CHECK (category = ANY (ARRAY['stiri'::text, 'anunt'::text, 'apel'::text, 'vand'::text, 'cumpar'::text])),
  links ARRAY DEFAULT '{}'::text[],
  created_by uuid,
  author_name text,
  author_ip text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ziar_posts_pkey PRIMARY KEY (id),
  CONSTRAINT ziar_posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);