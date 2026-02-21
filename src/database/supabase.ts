import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key ) {
    throw new Error('Missing Subabase environment variables.')
}

export const supabase = createClient(url, key);