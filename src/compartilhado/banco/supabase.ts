// ============================================================
// compartilhado/banco/supabase.ts
// CONEXÃO COM O BACK-END: cria o cliente do Supabase usado por TODO o site.
// Toda consulta passa por aqui: supabase.from("tabela") lê/grava tabelas e supabase.rpc("funcao")
// chama funções do banco (pasta supabase/). A chave é pública: quem protege os dados é o RLS do banco.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nyyrkuziswydhnukliiy.supabase.co";
const supabaseKey = "sb_publishable_MOPkuSw2da47NQUQ03KO-A_vZdmpkNb";

// Conexão com o Supabase. A chave é pública; a proteção dos dados é feita pelo RLS.
// PKCE: o link do e-mail volta com "?code=", que não conflita com as rotas "#/".
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: "pkce" },
});
