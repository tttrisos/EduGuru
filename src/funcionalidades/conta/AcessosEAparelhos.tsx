// ============================================================
// funcionalidades/conta/AcessosEAparelhos.tsx
// ACESSOS E APARELHOS (cartão em Minha conta). Ajuda o usuário a perceber um acesso estranho:
//   - últimos logins, com o tipo de aparelho (ex.: "Chrome no Windows") e se usou o código das duas etapas;
//   - quantas vezes alguém errou a senha da conta nos últimos 30 dias;
//   - "Sair dos outros aparelhos": encerra todas as outras sessões (este aparelho continua logado).
// Banco: meus_acessos e o evento 'sessoes_encerradas' (supabase/24).
// ============================================================

import { useEffect, useState } from 'react'
import { MonitorSmartphone } from 'lucide-react'
import { supabase } from '../../compartilhado/banco/supabase'
import { registrarLogEvento } from '../../compartilhado/banco/log'
import { useDialogo } from '../../compartilhado/componentes/Dialogo'
import { useAuth } from '../../compartilhado/sessao/ContextoSessao'

type Acessos = {
  logins: { quando: string; aparelho: string | null; com_codigo: boolean }[]
  senhas_erradas_30_dias: number
  ultima_senha_errada: string | null
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

export default function AcessosEAparelhos() {
  const { temMfa } = useAuth()
  const { confirmar } = useDialogo()
  const [acessos, setAcessos] = useState<Acessos | null>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    supabase.rpc('meus_acessos').then(({ data, error }) => {
      if (error) setErro('Não foi possível carregar os seus acessos.')
      else setAcessos(data as Acessos)
    })
  }, [])

  async function sairDosOutros() {
    setErro('')
    setSucesso('')
    const ok = await confirmar({
      titulo: 'Sair de todos os outros aparelhos?',
      mensagem:
        'Todos os outros computadores e celulares conectados à sua conta serão desconectados. Este aparelho continua logado. Se você não reconhece algum acesso, troque também a sua senha.',
      textoConfirmar: 'Sair dos outros',
    })
    if (!ok) return
    setEnviando(true)
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (!error) await registrarLogEvento('sessoes_encerradas')
    setEnviando(false)
    if (error) setErro('Não foi possível desconectar os outros aparelhos. Tente de novo.')
    else setSucesso('Pronto! Os outros aparelhos foram desconectados.')
  }

  const erradas = Number(acessos?.senhas_erradas_30_dias ?? 0)

  return (
    <div className="cartao conta-secao">
      <h3>
        <MonitorSmartphone size={20} aria-hidden="true" /> Acessos e aparelhos
      </h3>
      <p>Confira de onde a sua conta foi acessada. Se não reconhecer algum acesso, saia dos outros aparelhos e troque a senha.</p>

      {erro ? <p className="aviso erro">{erro}</p> : null}
      {!acessos && !erro ? <p className="status">Carregando...</p> : null}

      {acessos && erradas > 0 ? (
        <p className="aviso alerta-conta" role="status">
          ⚠️ A senha da sua conta foi digitada errada <strong>{erradas} vez(es)</strong> nos últimos 30 dias
          {acessos.ultima_senha_errada ? ` (a última em ${formatarData(acessos.ultima_senha_errada)})` : ''}. Se não foi
          você, troque a senha{temMfa ? '' : ' e ative a verificação em duas etapas'}.
        </p>
      ) : null}

      {acessos ? (
        acessos.logins.length === 0 ? (
          <p className="vazio">Nenhum login registrado nos últimos 90 dias.</p>
        ) : (
          <ul className="lista">
            {acessos.logins.map((l, i) => (
              <li key={`${l.quando}-${i}`} className="item-lista">
                <div>
                  <strong>
                    {l.aparelho ?? 'Aparelho não informado'}
                    {i === 0 ? <span className="selo">mais recente</span> : null}
                  </strong>
                  <span className="item-meta">
                    {formatarData(l.quando)} · {l.com_codigo ? 'com o código das duas etapas' : 'só com a senha'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {sucesso ? <p className="aviso sucesso">{sucesso}</p> : null}
      <button type="button" className="btn btn-secundario" onClick={sairDosOutros} disabled={enviando}>
        {enviando ? 'Desconectando...' : 'Sair dos outros aparelhos'}
      </button>
    </div>
  )
}
