import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyyrkuziswydhnukliiy.supabase.co'
const supabaseKey = 'sb_publishable_MOPkuSw2da47NQUQ03KO-A_vZdmpkNb'

export const supabase = createClient(supabaseUrl, supabaseKey)