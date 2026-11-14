import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'

// Janela de confirmação do EduGuru, no lugar do window.confirm / window.prompt do navegador.
// Uso: const { confirmar } = useDialogo(); if (!(await confirmar({ titulo: '...' }))) return

type OpcoesConfirmar = {
  titulo: string
  mensagem?: string
  textoConfirmar?: string
  perigo?: boolean // botão vermelho, para ações que apagam algo
}

type OpcoesTexto = OpcoesConfirmar & {
  rotulo: string
  valorInicial?: string
  exigir?: string // só libera o botão quando o texto digitado for exatamente este
}

type Pedido = OpcoesTexto & { comTexto: boolean; responder: (resposta: string | null) => void }

type Dialogo = {
  confirmar: (opcoes: OpcoesConfirmar) => Promise<boolean>
  pedirTexto: (opcoes: OpcoesTexto) => Promise<string | null>
}

const DialogoContext = createContext<Dialogo | null>(null)

export function DialogoProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)

  function confirmar(opcoes: OpcoesConfirmar) {
    return new Promise<boolean>((resolve) =>
      setPedido({ ...opcoes, rotulo: '', comTexto: false, responder: (r) => resolve(r !== null) }),
    )
  }

  function pedirTexto(opcoes: OpcoesTexto) {
    return new Promise<string | null>((resolve) => setPedido({ ...opcoes, comTexto: true, responder: resolve }))
  }

  function fechar(resposta: string | null) {
    pedido?.responder(resposta)
    setPedido(null)
  }

  return (
    <DialogoContext.Provider value={{ confirmar, pedirTexto }}>
      {children}
      {pedido ? <JanelaDialogo pedido={pedido} fechar={fechar} /> : null}
    </DialogoContext.Provider>
  )
}

function JanelaDialogo({ pedido, fechar }: { pedido: Pedido; fechar: (resposta: string | null) => void }) {
  const [texto, setTexto] = useState(pedido.valorInicial ?? '')
  const campoRef = useRef<HTMLInputElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const confirmarRef = useRef<HTMLButtonElement>(null)

  // Foco: no campo de texto; em ação perigosa, no "Cancelar" (o caminho seguro).
  useEffect(() => {
    if (pedido.comTexto) campoRef.current?.focus()
    else if (pedido.perigo) cancelarRef.current?.focus()
    else confirmarRef.current?.focus()
  }, [pedido])

  // Esc fecha sem confirmar.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [fechar])

  const liberado = !pedido.exigir || texto.trim() === pedido.exigir

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (liberado) fechar(pedido.comTexto ? texto.trim() : '')
  }

  return (
    <div className="dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar(null)}>
      <form
        className="dialogo cartao"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby={pedido.mensagem ? 'dialogo-mensagem' : undefined}
        onSubmit={aoEnviar}
      >
        <div className={`dialogo-icone${pedido.perigo ? ' perigo' : ''}`} aria-hidden="true">
          {pedido.perigo ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
        </div>
        <h3 id="dialogo-titulo">{pedido.titulo}</h3>
        {pedido.mensagem ? (
          <p id="dialogo-mensagem" className="dialogo-mensagem">
            {pedido.mensagem}
          </p>
        ) : null}

        {pedido.comTexto ? (
          <label className="rotulo">
            {pedido.rotulo}
            <input
              ref={campoRef}
              className="campo"
              value={texto}
              maxLength={200}
              onChange={(e) => setTexto(e.target.value)}
              autoComplete="off"
            />
          </label>
        ) : null}

        <div className="dialogo-botoes">
          <button ref={cancelarRef} type="button" className="btn btn-secundario" onClick={() => fechar(null)}>
            Cancelar
          </button>
          <button
            ref={confirmarRef}
            type="submit"
            className={`btn ${pedido.perigo ? 'btn-perigo-cheio' : 'btn-primario'}`}
            disabled={!liberado}
          >
            {pedido.textoConfirmar ?? 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDialogo() {
  const contexto = useContext(DialogoContext)
  if (!contexto) throw new Error('useDialogo precisa estar dentro do DialogoProvider.')
  return contexto
}
