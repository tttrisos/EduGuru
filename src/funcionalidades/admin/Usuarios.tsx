import { useEffect, useState } from 'react'
import { useDialogo } from '../../compartilhado/Dialogo'
import { supabase } from '../../compartilhado/supabase'
import { useAuth } from '../../compartilhado/AuthContext'
import { CURSOS, type UsuarioAdmin } from '../../compartilhado/tipos'
import { removerArquivosDoUsuario } from '../lgpd/conta'

// Gestão de contas pelo admin: excluir conta (RF15) e redefinir o MFA (RF26).

async function consultarUsuarios() {
  return await supabase.rpc('listar_usuarios_admin')
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Usuarios() {
  const { confirmar, pedirTexto } = useDialogo()
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

  useEffect(() => {
    consultarUsuarios().then(({ data, error }) => {
      if (error) setErro(error.message)
      else setLista((data as UsuarioAdmin[]) ?? [])
      setCarregando(false)
    })
  }, [])

  // Perdeu o celular: apaga o autenticador; no próximo login cadastra de novo.
  async function redefinirMfa(alvo: UsuarioAdmin) {
    setErro('')
    setMensagem('')
    const confirmou = await confirmar({
      titulo: `Redefinir a verificação em duas etapas de ${alvo.nome}?`,
      mensagem:
        'Faça isso só se a própria pessoa pediu (ex.: perdeu o celular). No próximo login ela ' +
        'precisará cadastrar o aplicativo autenticador de novo.',
      textoConfirmar: 'Redefinir',
    })
    if (!confirmou) return

    const { error } = await supabase.rpc('redefinir_mfa_usuario', { alvo: alvo.id })
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem(`Verificação em duas etapas de ${alvo.nome} redefinida.`)
    buscar()
  }

  async function excluir(alvo: UsuarioAdmin) {
    setErro('')
    setMensagem('')
    const digitado = await pedirTexto({
      titulo: `Excluir a conta de ${alvo.nome}?`,
      mensagem:
        `${alvo.email}\n\nIsso apaga o perfil, a conta de acesso e os materiais enviados por essa pessoa. ` +
        'Não pode ser desfeito.',
      rotulo: 'Digite EXCLUIR para confirmar',
      exigir: 'EXCLUIR',
      textoConfirmar: 'Excluir conta',
      perigo: true,
    })
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
        <p>Contas cadastradas na plataforma.</p>
        <p className="pagina-fatos">
          <span>Excluir apaga perfil, acesso e materiais da pessoa</span>
          <span>Toda exclusão fica no log</span>
          <span>A sua própria conta é excluída em Meus dados e privacidade</span>
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
                    desde {formatarData(u.criado_em)} · MFA {u.mfa_ativo ? 'ativo' : 'não cadastrado'}
                  </span>
                </div>
                {u.id !== usuario?.id ? (
                  <div className="acoes">
                    {u.mfa_ativo ? (
                      <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => redefinirMfa(u)}>
                        Redefinir MFA
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-perigo"
                      onClick={() => excluir(u)}
                      disabled={excluindoId === u.id}
                    >
                      {excluindoId === u.id ? 'Excluindo...' : 'Excluir conta'}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
