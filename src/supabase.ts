import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nyyrkuziswydhnukliiy.supabase.co";
const supabaseKey = "sb_publishable_MOPkuSw2da47NQUQ03KO-A_vZdmpkNb";

// Fluxo PKCE: links de e-mail do Supabase (ex.: redefinição de senha) voltam
// com "?code=..." antes do "#". No fluxo padrão o token viria depois do "#",
// e isso conflita com as rotas do HashRouter (/#/rota).
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: "pkce" },
});
