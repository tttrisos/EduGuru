import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nyyrkuziswydhnukliiy.supabase.co";
const supabaseKey = "sb_publishable_MOPkuSw2da47NQUQ03KO-A_vZdmpkNb";

// A chave publishable é feita para ficar no navegador: o que cada pessoa pode ler ou gravar
// é decidido no banco (token de login + RLS). A chave service_role nunca fica no front-end.
// PKCE: o link do e-mail volta com "?code=", que não conflita com as rotas "#/".
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: "pkce" },
});
