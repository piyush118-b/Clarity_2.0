DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

DROP FUNCTION IF EXISTS create_profile_for_new_user();