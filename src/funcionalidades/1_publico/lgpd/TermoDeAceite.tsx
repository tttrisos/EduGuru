import { Link } from 'react-router-dom'
import './lgpd.css'

export default function TermoDeAceite() {
  return (
    <div className="termos-tela">
      <div className="termos-conteudo cartao">
        <Link to="/" className="termos-voltar">
          ← Voltar
        </Link>

        <p className="aviso">
          Versão 2.1 — 22/11/2026. Projeto acadêmico (PFC) da Universidade de Mogi das
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
        <p>
          Na área <strong>Carreiras</strong>, o EduGuru mostra vagas de tecnologia publicadas
          por terceiros em comunidades abertas do GitHub e sugere áreas a partir do seu
          desempenho no quiz e na Bússola EduGuru, uma autoavaliação de interesses opcional. Essas
          sugestões são uma orientação simples, não um teste vocacional nem uma avaliação profissional
          ou psicológica. A candidatura acontece no site de origem da vaga: o
          EduGuru não recebe currículo nem dados de candidatura e não se responsabiliza pelo
          conteúdo, pela veracidade ou pelo processo seletivo das vagas.
        </p>

        <h2>2. Quem pode usar</h2>
        <p>
          O acesso é destinado a estudantes de graduação da UMC nos cursos listados
          acima. Cada pessoa deve manter apenas uma conta, com informações verdadeiras. A conta
          só passa a valer depois que você abre o link enviado ao e-mail informado; se ele não
          for aberto em 24 horas (por exemplo, por um e-mail digitado errado), o cadastro é
          apagado sozinho e você pode se cadastrar de novo. O EduGuru é feito para estudantes de
          graduação e não é destinado a crianças; quem tiver menos de 18 anos deve usá-lo com o
          conhecimento do seu responsável.
        </p>

        <h2>3. Contas e papéis de acesso</h2>
        <p>Existem dois tipos de conta:</p>
        <ul>
          <li>
            <strong>Aluno</strong> (padrão de qualquer cadastro): responde quizzes, ganha
            pontos e participa do ranking, recebe indicações do Guru, visualiza disciplinas e materiais e pode anexar materiais
            próprios — editando ou excluindo apenas os que ele mesmo enviou.
          </li>
          <li>
            <strong>Administrador</strong> (atribuído manualmente pela equipe do
            projeto): além do que o aluno pode fazer, cadastra/edita/exclui disciplinas
            e perguntas do quiz (com o gabarito), remove qualquer material, gerencia e
            exclui contas de usuários, redefine a verificação em duas etapas de quem
            perdeu o celular e acessa o histórico de auditoria. No ranking, vê também o
            nome de quem escolheu aparecer como &quot;Aluno anônimo&quot; para os colegas.
          </li>
        </ul>
        <p>
          <strong>Verificação em duas etapas (opcional para alunos, obrigatória para
          administradores):</strong> em Minha conta, você pode ativar um aplicativo
          autenticador (ex.: Google Authenticator, Microsoft Authenticator); a partir daí,
          além da senha, todo login pede o código de 6 dígitos do aplicativo. Recomendamos
          ativar. Você pode desativar quando quiser, confirmando com a senha atual; sem
          ela, ao entrar num aparelho novo, o EduGuru pede um código enviado ao seu e-mail
          (o aparelho pode ser lembrado por 30 dias). Você é responsável por manter sua
          senha e o acesso ao seu e-mail em sigilo e o aplicativo autenticador sob seu
          controle; nunca passe o código para outra pessoa. Se perder o acesso
          ao aplicativo, peça a um administrador para redefinir a verificação. Avise a
          equipe do projeto imediatamente se suspeitar de acesso indevido à sua conta.
          Por segurança, a sessão é encerrada sozinha depois de 30 minutos sem uso do site.
        </p>
        <p>
          Você pode excluir sua conta a qualquer momento, na tela <strong>Minha
          conta</strong>. A exclusão é permanente.
        </p>

        <h2>4. Condutas proibidas</h2>
        <ul>
          <li>Compartilhar sua conta com terceiros;</li>
          <li>Tentar acessar dados ou funcionalidades administrativas sem permissão;</li>
          <li>
            Enviar, como material, links ou arquivos com conteúdo ilegal, ofensivo,
            adulto, de apostas, pirataria ou que viole direitos autorais de terceiros;
          </li>
          <li>
            Colocar dados pessoais (seus ou de outras pessoas, como CPF, e-mail ou
            telefone) no título, na descrição ou no arquivo de um material;
          </li>
          <li>Tentar sobrecarregar, invadir ou interromper o funcionamento da plataforma;</li>
          <li>
            Tentar burlar a pontuação do quiz ou do ranking (ex.: usar contas extras ou
            chamar a API diretamente para obter pontos).
          </li>
        </ul>

        <h2>5. Conteúdo enviado pelo usuário</h2>
        <p>
          Ao compartilhar um material (link ou PDF/DOCX), você declara ter o direito de
          compartilhá-lo com os demais usuários da plataforma. Depois de aprovado, o
          material aparece para todo usuário logado no fim do quiz da disciplina e no seu
          perfil público, junto do seu <strong>nome abreviado</strong> (ex.: Maria S.) e do
          seu <strong>curso</strong>. Todo material passa por um filtro automático: links de
          sites da lista de permitidos são publicados na hora; links de outros sites e arquivos
          ficam em análise até a equipe aprovar. Qualquer
          usuário pode denunciar um material: com 3 denúncias ele é ocultado até a equipe
          analisar. A equipe do EduGuru pode recusar ou remover qualquer conteúdo que
          viole este Termo, sem aviso prévio. Ao excluir sua conta, os materiais que você
          enviou também são excluídos.
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
          Este Termo pode ser atualizado conforme o projeto evolui. Quando o Termo ou a
          Política de Privacidade mudarem de versão, a plataforma pede um novo aceite no
          seu próximo acesso, antes de liberar a área logada. Se não concordar, você pode
          excluir sua conta na mesma tela, sem precisar aceitar.
        </p>

        <p className="termos-rodape-nota">
          Última atualização deste Termo de Aceite: versão 2.1, 22/11/2026. Veja também
          a <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  )
}
