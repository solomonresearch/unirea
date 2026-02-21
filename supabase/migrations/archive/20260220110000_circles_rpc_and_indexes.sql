-- Indexes for circle matching performance
CREATE INDEX IF NOT EXISTS idx_profiles_highschool ON profiles(highschool) WHERE onboarding_completed = true;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(city, country) WHERE onboarding_completed = true;
CREATE INDEX IF NOT EXISTS idx_profiles_hobbies ON profiles USING GIN(hobbies) WHERE onboarding_completed = true;
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON profiles USING GIN(profession) WHERE onboarding_completed = true;
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON profiles USING GIN(domain) WHERE onboarding_completed = true;
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company) WHERE onboarding_completed = true;

-- RPC: get circle counts and intersection counts for a user
CREATE OR REPLACE FUNCTION get_circles_data(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  u profiles%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO u FROM profiles WHERE id = p_user_id;

  result := jsonb_build_object(
    'circles', jsonb_build_object(
      'highschool', (SELECT count(*) FROM profiles WHERE highschool = u.highschool AND id != p_user_id AND onboarding_completed),
      'location', (SELECT count(*) FROM profiles WHERE city = u.city AND country = u.country AND id != p_user_id AND onboarding_completed),
      'hobbies', (SELECT count(*) FROM profiles WHERE hobbies && u.hobbies AND id != p_user_id AND onboarding_completed),
      'interests', (SELECT count(*) FROM profiles WHERE domain && u.domain AND id != p_user_id AND onboarding_completed),
      'profession', (SELECT count(*) FROM profiles WHERE profession && u.profession AND id != p_user_id AND onboarding_completed),
      'background', (SELECT count(*) FROM profiles WHERE (company = u.company OR domain && u.domain) AND id != p_user_id AND onboarding_completed)
    ),
    'personal_intersections', jsonb_build_object(
      'hs_location', (SELECT count(*) FROM profiles WHERE highschool = u.highschool AND city = u.city AND country = u.country AND id != p_user_id AND onboarding_completed),
      'hs_hobbies', (SELECT count(*) FROM profiles WHERE highschool = u.highschool AND hobbies && u.hobbies AND id != p_user_id AND onboarding_completed),
      'location_hobbies', (SELECT count(*) FROM profiles WHERE city = u.city AND country = u.country AND hobbies && u.hobbies AND id != p_user_id AND onboarding_completed),
      'location_interests', (SELECT count(*) FROM profiles WHERE city = u.city AND country = u.country AND domain && u.domain AND id != p_user_id AND onboarding_completed),
      'hs_location_hobbies', (SELECT count(*) FROM profiles WHERE highschool = u.highschool AND city = u.city AND country = u.country AND hobbies && u.hobbies AND id != p_user_id AND onboarding_completed)
    ),
    'professional_intersections', jsonb_build_object(
      'hs_profession', (SELECT count(*) FROM profiles WHERE highschool = u.highschool AND profession && u.profession AND id != p_user_id AND onboarding_completed),
      'location_profession', (SELECT count(*) FROM profiles WHERE city = u.city AND country = u.country AND profession && u.profession AND id != p_user_id AND onboarding_completed),
      'location_background', (SELECT count(*) FROM profiles WHERE city = u.city AND country = u.country AND (company = u.company OR domain && u.domain) AND id != p_user_id AND onboarding_completed),
      'profession_background', (SELECT count(*) FROM profiles WHERE profession && u.profession AND (company = u.company OR domain && u.domain) AND id != p_user_id AND onboarding_completed),
      'hs_location_profession', (SELECT count(*) FROM profiles WHERE highschool = u.highschool AND city = u.city AND country = u.country AND profession && u.profession AND id != p_user_id AND onboarding_completed)
    ),
    'user_info', jsonb_build_object(
      'highschool', u.highschool,
      'graduation_year', u.graduation_year,
      'city', u.city,
      'country', u.country,
      'hobbies', u.hobbies,
      'profession', u.profession,
      'domain', u.domain,
      'company', u.company
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: fetch people matching circle filters
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
    p.city, p.country,
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
