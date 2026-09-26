import { Link } from 'react-router-dom'

// Documento vivo, versão 1.0 (28/09/2026). Separado da Política de
// Privacidade (Privacidade.tsx) por decisão do orientador e coorientador.
export default function TermoDeAceite() {
  return (
    <div className="termos-tela">
      <div className="termos-conteudo cartao">
        <Link to="/login" className="termos-voltar">
          ← Voltar
        </Link>

        <p className="aviso">
          Versão 1.0 — 28/09/2026. Projeto acadêmico (PFC) da Universidade de Mogi das
          Cruzes; numa implantação real, este documento passaria por revisão jurídica.
        </p>

        <h1>Termo de Aceite</h1>
        <p className="aviso">
          Este documento trata das regras de uso da plataforma. Como seus dados
          pessoais são tratados está na{' '}
          <Link to="/privacidade">Política de Privacidade</Link>, documento separado.
        </p>

        <h2>1. O que é o EduGuru</h2>
        <p>
          O EduGuru é uma plataforma acadêmica, desenvolvida como Projeto Final de Curso
          da UMC, que reúne quizzes gamificados, materiais de estudo e acompanhamento de
          desempenho para estudantes de Sistemas de Informação, Análise e
          Desenvolvimento de Sistemas e Engenharia de Software.
        </p>

        <h2>2. Quem pode usar</h2>
        <p>
          O acesso é destinado a estudantes de graduação da UMC nos cursos listados
          acima. Cada pessoa deve manter apenas uma conta, com informações verdadeiras.
        </p>

        <h2>3. Contas e papéis de acesso</h2>
        <p>Existem dois tipos de conta:</p>
        <ul>
          <li>
            <strong>Aluno</strong> (padrão de qualquer cadastro): visualiza disciplinas,
            perguntas e materiais, e pode anexar materiais próprios.
          </li>
          <li>
            <strong>Administrador</strong> (atribuído manualmente pela equipe do
            projeto): além do que o aluno pode fazer, cadastra/edita/exclui disciplinas
            e perguntas do quiz, e acessa o histórico de auditoria.
          </li>
        </ul>
        <p>
          Você é responsável por manter sua senha em sigilo. Avise a equipe do projeto
          imediatamente se suspeitar de acesso indevido à sua conta.
        </p>

        <h2>4. Condutas proibidas</h2>
        <ul>
          <li>Compartilhar sua conta com terceiros;</li>
          <li>Tentar acessar dados ou funcionalidades administrativas sem permissão;</li>
          <li>
            Enviar, como material, arquivos com conteúdo ilegal, ofensivo ou que viole
            direitos autorais de terceiros;
          </li>
          <li>Tentar sobrecarregar, invadir ou interromper o funcionamento da plataforma.</li>
        </ul>

        <h2>5. Conteúdo enviado pelo usuário</h2>
        <p>
          Ao anexar um material (PDF/DOCX), você declara ter o direito de compartilhá-lo
          com os demais usuários da plataforma. A equipe do EduGuru pode remover
          qualquer conteúdo que viole este Termo, sem aviso prévio.
        </p>

        <h2>6. Disponibilidade e encerramento</h2>
        <p>
          Por ser um projeto acadêmico, o EduGuru pode passar por manutenções,
          instabilidades ou alterações significativas sem aviso prévio formal. A equipe
          pode encerrar contas que violem este Termo, e pode encerrar a plataforma ao
          final do ciclo acadêmico do PFC.
        </p>

        <h2>7. Alterações deste Termo</h2>
        <p>
          Este Termo pode ser atualizado conforme o projeto evolui. Mudanças relevantes
          serão comunicadas na própria plataforma, com a data de versão atualizada
          abaixo.
        </p>

        <p className="termos-rodape-nota">
          Última atualização deste Termo de Aceite: versão 1.0, 28/09/2026. Veja também
          a <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  )
}
