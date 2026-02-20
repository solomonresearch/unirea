-- Update get_circle_people to return county
CREATE OR REPLACE FUNCTION get_circle_people(
  p_user_id uuid,
  p_circle_type text,
  p_intersect_with text[] DEFAULT '{}',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  avatar_url text,
  highschool text,
  graduation_year int,
  city text,
  county text,
  country text,
  hobbies text[],
  profession text[],
  domain text[],
  company text,
  bio text,
  overlap_score int
) AS $$
DECLARE
  u profiles%ROWTYPE;
  all_filters text[];
BEGIN
  SELECT * INTO u FROM profiles p WHERE p.id = p_user_id;

  all_filters := p_intersect_with || ARRAY[p_circle_type];

  RETURN QUERY
  SELECT
    p.id, p.name, p.username, p.avatar_url,
    p.highschool, p.graduation_year,
    p.city, p.county, p.country,
    p.hobbies, p.profession, p.domain, p.company, p.bio,
    (
      (CASE WHEN p.highschool = u.highschool THEN 1 ELSE 0 END) +
      (CASE WHEN p.city = u.city AND p.country = u.country THEN 1 ELSE 0 END) +
      COALESCE(array_length(ARRAY(SELECT unnest(p.hobbies) INTERSECT SELECT unnest(u.hobbies)), 1), 0) +
      COALESCE(array_length(ARRAY(SELECT unnest(p.profession) INTERSECT SELECT unnest(u.profession)), 1), 0) +
      COALESCE(array_length(ARRAY(SELECT unnest(p.domain) INTERSECT SELECT unnest(u.domain)), 1), 0) +
      (CASE WHEN p.company = u.company AND p.company IS NOT NULL THEN 1 ELSE 0 END)
    )::int AS overlap_score
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.onboarding_completed = true
    AND (NOT 'highschool' = ANY(all_filters) OR p.highschool = u.highschool)
    AND (NOT 'location' = ANY(all_filters) OR (p.city = u.city AND p.country = u.country))
    AND (NOT 'hobbies' = ANY(all_filters) OR p.hobbies && u.hobbies)
    AND (NOT 'interests' = ANY(all_filters) OR p.domain && u.domain)
    AND (NOT 'profession' = ANY(all_filters) OR p.profession && u.profession)
    AND (NOT 'background' = ANY(all_filters) OR (p.company = u.company OR p.domain && u.domain))
  ORDER BY overlap_score DESC, p.name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
