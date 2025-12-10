
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uajwvilmdxvmnrfrorfg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhand2aWxtZHh2bW5yZnJvcmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MTA3OTAsImV4cCI6MjA2NDA4Njc5MH0.VfttwevAEa55JbFMa9YsJ-NdfPgjPhDdTfMUMHOPX4U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
