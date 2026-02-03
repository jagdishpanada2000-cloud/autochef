-- =====================================================
-- FIX RESTAURANTS TABLE SCHEMA
-- Adds missing columns expected by the UI
-- =====================================================

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS cuisine_type TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS delivery_time TEXT DEFAULT '20-30 min',
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- Update types.ts to match (handled automatically if using CLI, but good to know)
