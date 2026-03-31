import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://wqpbuthbafenkaxwiant.supabase.co'
const SUPABASE_KEY = 'sb_publishable_BocZ5OOpGKdHEJo14i1zLA_Nvqrwe5Q'

// Creamos la instancia
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// La exportamos al final (esta forma es más clara para el navegador)
export { supabase };