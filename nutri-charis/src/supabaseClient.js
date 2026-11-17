import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyagdcavsamhdiuuuddu.supabase.co'
const supabaseAnonKey = 'sb_publishable_vpNjcONw3uMMAkOhIqfi9w_QJhkl_py'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);