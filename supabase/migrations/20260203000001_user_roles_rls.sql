-- =====================================================
-- USER_ROLES TABLE RLS POLICIES
-- Enable users to read and insert their own role
-- =====================================================

-- Enable RLS on user_roles table (if not already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;

-- Users can read their own role
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own role (only once, due to UNIQUE constraint)
CREATE POLICY "Users can insert own role" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own role (optional - you might want to disable this)
-- CREATE POLICY "Users can update own role" ON public.user_roles
--     FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PROFILES TABLE RLS POLICIES (if not set)
-- =====================================================

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Optional: Allow public viewing of profiles (for displaying owner names, etc.)
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
--     FOR SELECT USING (true);
