import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { CURSOS, type UsuarioAdmin } from '../types'
import { removerArquivosDoUsuario } from '../lib/conta'

// Gestão de contas pelo administrador (RF15: exclusão de conta por admin).
// A lista vem de uma função do banco que só responde para admin com MFA
// e não traz cidade/estado (minimização).

async function consultarUsuarios() {
  return await supabase.rpc('listar_usuarios_admin')
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Usuarios() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState<UsuarioAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  async function buscar() {
    const { data, error } = await consultarUsuarios()
    if (error) setErro(error.message)
    else setLista((data as UsuarioAdmin[]) ?? [])
  }

  // Carga inicial: o setState fica dentro do .then (callback assíncrono),
  // não no corpo do efeito — é o que pede a regra react-hooks/set-state-in-effect.
  useEffect(() => {
    consultarUsuarios().then(({ data, error }) => {
      if (error) setErro(error.message)
      else setLista((data as UsuarioAdmin[]) ?? [])
      setCarregando(false)
    })
  }, [])

  async function excluir(alvo: UsuarioAdmin) {
    setErro('')
    setMensagem('')
    const digitado = window.prompt(
      `Excluir a conta de ${alvo.nome} (${alvo.email})?\n\n` +
        'Isso apaga o perfil, a conta de acesso e os materiais enviados por essa pessoa. ' +
        'Não pode ser desfeito.\n\nDigite EXCLUIR para confirmar:',
    )
    if (digitado !== 'EXCLUIR') return

    setExcluindoId(alvo.id)
    const erroArquivos = await removerArquivosDoUsuario(alvo.id)
    if (erroArquivos) {
      setExcluindoId(null)
      setErro(`Não foi possível remover os arquivos do usuário: ${erroArquivos}`)
      return
    }

    const { error } = await supabase.rpc('excluir_conta_usuario', { alvo: alvo.id })
    setExcluindoId(null)
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem(`Conta de ${alvo.nome} excluída.`)
    buscar()
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <h2>Usuários</h2>
        <p>
          Contas cadastradas. A exclusão remove perfil, conta de acesso e materiais enviados pelo
          usuário, e fica registrada no log de auditoria. Para excluir a sua própria conta, use
          Minha conta.
        </p>
      </header>

      <div className="cartao">
        {erro ? <p className="aviso erro">{erro}</p> : null}
        {mensagem ? <p className="aviso sucesso">{mensagem}</p> : null}
        {carregando ? <p className="status">Carregando...</p> : null}

        {!carregando && lista.length === 0 ? (
          <p className="vazio">Nenhum usuário encontrado.</p>
        ) : (
          <ul className="lista">
            {lista.map((u) => (
              <li key={u.id} className="item-lista">
                <div>
                  <strong>
                    {u.nome}{' '}
                    <span className={`selo${u.papel === 'admin' ? ' selo-admin' : ''}`}>
                      {u.papel === 'admin' ? 'Administrador' : 'Aluno'}
                    </span>
                  </strong>
                  <span className="item-meta">
                    {u.email} · {CURSOS.find((c) => c.valor === u.curso)?.label ?? u.curso ?? 'sem curso'} ·
                    desde {formatarData(u.criado_em)}
                  </span>
                </div>
                {u.id !== usuario?.id ? (
                  <button
                    type="button"
                    className="btn btn-perigo"
                    onClick={() => excluir(u)}
                    disabled={excluindoId === u.id}
                  >
                    {excluindoId === u.id ? 'Excluindo...' : 'Excluir conta'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
