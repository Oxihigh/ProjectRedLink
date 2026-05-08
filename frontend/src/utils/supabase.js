import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pycuxjsstmragkmyngei.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Y3V4anNzdG1yYWdrbXluZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjk5NzcsImV4cCI6MjA5Mzc0NTk3N30.EymISd2aAI6XFYu7TjRekkC8jakvuGOfF9A0HDuo2k8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
