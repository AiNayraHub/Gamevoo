import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kozmxgymkitcbevtufgz.supabase.co';
const supabaseAnonKey = 'sb_publishable_sMp15iZ3aHBEz44x6YzISA_3fihZSgX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
