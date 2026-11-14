// ============================================================
// funcionalidades/conta/TrocarSenha.tsx
// TROCAR SENHA JÁ LOGADO (cartão em Minha conta). Passo a passo nos comentários abaixo.
// ============================================================

import { useState } from 'react'
import { supabase } from '../../compartilhado/banco/supabase'
import { registrarLogEvento } from '../../compartilhado/banco/log'
import { REGRAS_SENHA, validarTrocaDeSenha } from '../acesso/regrasSenha'

// Trocar a senha estando logado (cartão da tela Minha conta).
// Passo a passo:
//   1) confere no navegador: regras da senha nova, confirmação igual e nova ≠ atual;
//   2) confere a senha ATUAL no banco: rpc conferir_senha_atual (supabase/21_trocar_senha.sql);
//   3) grava a nova pelo Supabase Auth: supabase.auth.updateUser({ password });
//   4) registra 'senha_alterada' no log e desconecta os OUTROS aparelhos (este continua logado).
export default function TrocarSenha() {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    // 1) Validações rápidas, sem ir ao servidor (regras em acesso/senha.ts, com testes)
    const problema = validarTrocaDeSenha(atual, nova, confirmar)
    if (problema) return setErro(problema)

    setEnviando(true)

    // 2) A senha atual está certa? (o banco compara com o hash guardado)
    const conferencia = await supabase.rpc('conferir_senha_atual', { p_senha: atual })
    if (conferencia.error) {
      setEnviando(false)
      return setErro(conferencia.error.message)
    }
    if (conferencia.data !== true) {
      setEnviando(false)
      return setErro('A senha atual está incorreta.')
    }

    // 3) Grava a nova senha (o Supabase também recusa senha igual à atual: same_password)
    const { error } = await supabase.auth.updateUser({ password: nova })
    if (error) {
      setEnviando(false)
      return setErro(
        error.code === 'same_password'
          ? 'A nova senha precisa ser diferente da senha atual.'
          : `Não foi possível trocar a senha: ${error.message}`,
      )
    }

    // 4) Log e saída dos outros aparelhos
    await registrarLogEvento('senha_alterada')
    await supabase.auth.signOut({ scope: 'others' })

    setEnviando(false)
    setAtual('')
    setNova('')
    setConfirmar('')
    setSucesso('Senha alterada! Os outros aparelhos conectados à sua conta foram desconectados.')
  }

  return (
    <div className="cartao conta-secao">
      <h3>Trocar senha</h3>
      <p>Troque a senha sem sair da conta. Você continua conectado neste aparelho.</p>
      <form onSubmit={salvar} className="trocar-senha-form">
        <label className="rotulo">
          Senha atual
          <input
            className="campo"
            type="password"
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className="rotulo">
          Nova senha
          <input
            className="campo"
            type="password"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="rotulo">
          Confirmar a nova senha
          <input
            className="campo"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {/* As mesmas 5 regras do cadastro (acesso/senha.ts), marcadas enquanto digita */}
        <ul className="lista-regras-senha">
          {REGRAS_SENHA.map((regra) => {
            const ok = regra.testar(nova)
            return (
              <li key={regra.chave} className={ok ? 'regra-ok' : 'regra-falha'}>
                <span aria-hidden="true">{ok ? '✅' : '❌'}</span>
                {regra.descricao}
              </li>
            )
          })}
          <li className={nova && nova !== atual ? 'regra-ok' : 'regra-falha'}>
            <span aria-hidden="true">{nova && nova !== atual ? '✅' : '❌'}</span>
            Diferente da senha atual
          </li>
        </ul>

        {erro ? <p className="aviso erro">{erro}</p> : null}
        {sucesso ? <p className="aviso sucesso">{sucesso}</p> : null}

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Trocando...' : 'Trocar senha'}
        </button>
      </form>
    </div>
  )
}
