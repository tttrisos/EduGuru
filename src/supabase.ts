import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nyyrkuziswydhnukliiy.supabase.co";
const supabaseKey = "sb_publishable_MOPkuSw2da47NQUQ03KO-A_vZdmpkNb";

// Conexão com o Supabase. A chave é pública; a proteção dos dados é feita pelo RLS.
// PKCE: o link do e-mail volta com "?code=", que não conflita com as rotas "#/".
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: "pkce" },
});
