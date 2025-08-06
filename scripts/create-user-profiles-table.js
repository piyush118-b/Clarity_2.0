const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
)

async function createUserProfilesTable() {
  console.log('Creating user_profiles table...')
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create user_profiles table for onboarding data
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone_number TEXT,
        address_line_1 TEXT NOT NULL,
        address_line_2 TEXT,
        city TEXT NOT NULL,
        postcode TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'United Kingdom',
        housing_status TEXT NOT NULL CHECK (housing_status IN (
          'reality-tenant',
          'homeless', 
          'stable-housing',
          'unhappy-housing'
        )),
        situation_description TEXT,
        support_needs JSONB DEFAULT '[]'::jsonb,
        onboarding_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        
        -- Ensure one profile per user
        UNIQUE(user_id)
      );
      
      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);
      
      -- Enable RLS (Row Level Security)
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    `
  })
  
  if (error) {
    console.error('Error creating table:', error)
  } else {
    console.log('Table created successfully:', data)
  }
}

createUserProfilesTable()