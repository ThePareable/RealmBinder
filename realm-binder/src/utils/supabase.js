import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nqqgfgmzafiaamvhhibe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWdmZ216YWZpYWFtdmhoaWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjQwMDMsImV4cCI6MjA2OTQ0MDAwM30.tYUIX_SUL0DkcroTI3lNTxGJx1hd4t-Myo8hrujCqI0'

export const supabase = createClient(supabaseUrl, supabaseKey)