import { Link } from 'react-router-dom'

// Política de Privacidade, versão 1.2.
export default function Privacidade() {
  return (
    <div className="termos-tela">
      <div className="termos-conteudo cartao">
        <Link to="/" className="termos-voltar">
          ← Voltar
        </Link>

        <p className="aviso">
          Versão 1.2 — 27/10/2026. Documento vivo: atualizado sempre que uma
          funcionalidade nova passa a tratar dados pessoais (nesta versão: quiz,
          pontuação, ranking, Guru, notas e faltas). Finalidade
          acadêmica — este é um protótipo de Projeto Final de Curso; numa implantação
          real, as decisões abaixo seriam revisadas pelo controlador responsável
          (ex.: a instituição de ensino) e por assessoria jurídica.
        </p>

        <h1>Política de Privacidade</h1>

        <h2>1. Quem trata os seus dados</h2>
        <p>
          O EduGuru é desenvolvido por João Pedro, Luiz Antonio e Thiago, estudantes de
          Sistemas de Informação da Universidade de Mogi das Cruzes (UMC), como Projeto
          Final de Curso, com orientação do Prof. Oscar Alves Evangelista e coorientação
          do Prof. Alessandro Aparecido da Silva. Nesta fase de protótipo acadêmico, os
          próprios integrantes do grupo atuam como responsáveis pelo tratamento dos
          dados. Em uma implantação real fora do contexto acadêmico, esse papel seria da
          instituição de ensino que viesse a adotar a plataforma.
        </p>
        <p>
          Canal de contato para assuntos de privacidade (nesta fase acadêmica):
          e-mail da equipe do projeto, informado ao orientador.
        </p>

        <h2>2. Quais dados pessoais tratamos</h2>
        <ul>
          <li>
            <strong>Identificação e acesso:</strong> nome, e-mail e senha (a senha nunca
            é armazenada como texto — passa por hash automático do Supabase Auth antes
            de qualquer gravação).
          </li>
          <li>
            <strong>Verificação em duas etapas (MFA):</strong> o registro do aplicativo
            autenticador vinculado à sua conta (a chave secreta é guardada pelo Supabase
            Auth; o EduGuru não vê nem armazena os códigos de 6 dígitos).
          </li>
          <li>
            <strong>Registro do aceite:</strong> data, hora e versão do Termo de Aceite e
            desta Política aceitos no cadastro.
          </li>
          <li>
            <strong>Acadêmicos:</strong> curso (Sistemas de Informação, ADS ou Engenharia
            de Software), escolhido no cadastro.
          </li>
          <li>
            <strong>Localização (opcional):</strong> cidade e estado, obtidos a partir de
            um CEP informado voluntariamente no cadastro. O CEP em si, rua, número e
            bairro <strong>não são armazenados</strong> — apenas cidade/estado, e somente
            se a pessoa preencher esse campo opcional.
          </li>
          <li>
            <strong>Conteúdo da plataforma:</strong> disciplinas e perguntas de quiz
            cadastradas por administradores, e materiais de estudo (links e arquivos
            PDF/DOCX, até 5 MB) enviados por alunos ou administradores — cada material
            guarda quem o enviou.
          </li>
          <li>
            <strong>Desempenho nos quizzes:</strong> rodadas de quiz jogadas (data,
            disciplina, respostas escolhidas, acertos e pontos) e a sua escolha de
            aparecer ou não com o nome no ranking.
          </li>
          <li>
            <strong>Notas e faltas (opcional):</strong> M1, ND, NI, nota única (MS), nota de exame e
            quantidade de faltas que você mesmo registra em cada disciplina, para
            acompanhar sua situação.
          </li>
          <li>
            <strong>Registros de auditoria:</strong> login concluído, tentativas de login
            malsucedidas, códigos de verificação em duas etapas inválidos, ativação da
            verificação, logout, pedidos de redefinição de senha e senhas redefinidas,
            redefinição da verificação em duas etapas por um administrador, quizzes
            finalizados (acertos e pontos), criação/edição/exclusão de disciplinas,
            perguntas e materiais, registro de notas (apenas que houve a alteração, sem
            os valores das notas), alterações no perfil (apenas <em>quais</em> campos mudaram, não os
            valores) e exclusões de conta — sempre associados a quem realizou a ação e
            quando.
          </li>
        </ul>
        <p>
          Não coletamos CPF, data de nascimento, dados de saúde, dados biométricos,
          imagem ou voz. Se alguma dessas categorias vier a ser necessária no futuro
          (ex.: verificação de identidade), esta política será atualizada antes da
          coleta começar.
        </p>

        <h2>3. Para que usamos cada dado e com base em quê</h2>
        <div className="termos-tabela-wrap">
          <table className="termos-tabela">
            <thead>
              <tr>
                <th>Dado</th>
                <th>Finalidade</th>
                <th>Hipótese legal (LGPD)</th>
                <th>Retenção</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nome, e-mail, senha</td>
                <td>Criar e autenticar a conta, permitir login</td>
                <td>Execução de contrato / procedimento preliminar solicitado pelo titular (art. 7º, V)</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Fator de verificação em duas etapas (MFA)</td>
                <td>Proteger a conta contra acesso com senha vazada ou descoberta</td>
                <td>Execução de contrato (art. 7º, V), em atendimento ao dever de segurança (art. 46)</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Data e versão do aceite</td>
                <td>Comprovar que o titular aceitou o Termo e a Política</td>
                <td>Cumprimento de obrigação legal — comprovação do consentimento (art. 7º, II, e art. 8º, §2º)</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Curso</td>
                <td>Mostrar conteúdo relevante ao curso do aluno</td>
                <td>Execução de contrato</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Cidade/estado (via CEP, opcional)</td>
                <td>Exibir a localização no perfil do próprio aluno (tela Minha conta), como demonstração da integração com uma API externa (ViaCEP). Não é mostrada a outros usuários nem usada em ranking, estatística ou qualquer outra finalidade.</td>
                <td>Consentimento (o próprio ato de preencher um campo opcional), revogável a qualquer momento na tela Minha conta</td>
                <td>Enquanto a conta existir, ou até o titular revogar o consentimento</td>
              </tr>
              <tr>
                <td>Perguntas, disciplinas, materiais (e quem enviou cada material)</td>
                <td>Funcionamento do quiz e da biblioteca de materiais; permitir que só o autor (ou um admin) altere/exclua o material</td>
                <td>Execução de contrato / legítimo interesse educacional</td>
                <td>Até ser excluído pelo autor ou por um administrador, ou até a exclusão da conta do autor</td>
              </tr>
              <tr>
                <td>Rodadas de quiz, respostas e pontos</td>
                <td>Corrigir o quiz, calcular a pontuação e o ranking, mostrar seu desempenho no Painel e permitir que o Guru indique materiais quando o aproveitamento em uma disciplina fica abaixo de 60%</td>
                <td>Execução de contrato (art. 7º, V) — é a funcionalidade principal da plataforma</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Nome abreviado e pontos no ranking</td>
                <td>Gamificação: mostrar a classificação aos demais alunos. Só aparecem o primeiro nome e a inicial do sobrenome (ex.: &quot;Maria S.&quot;)</td>
                <td>Legítimo interesse educacional (art. 7º, IX), com direito de oposição: na tela Minha conta você passa a aparecer como &quot;Aluno anônimo&quot;</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Notas e faltas</td>
                <td>Calcular e mostrar, só para você, a situação em cada disciplina (média, exame, limite de faltas)</td>
                <td>Consentimento (art. 7º, I): registrar é opcional e você pode apagar a qualquer momento na tela Notas</td>
                <td>Até você apagar o registro ou excluir a conta</td>
              </tr>
              <tr>
                <td>Logs de auditoria</td>
                <td>Segurança, rastreabilidade e investigação de incidentes</td>
                <td>Legítimo interesse (segurança da aplicação) / cumprimento de obrigação legal</td>
                <td>90 dias corridos, apagados automaticamente após esse prazo</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Não usamos nenhum dado pessoal para publicidade, venda a terceiros, ou
          treinamento de modelos de inteligência artificial.
        </p>

        <h2>4. Compartilhamento e serviços externos</h2>
        <ul>
          <li>
            <strong>Supabase</strong> (hospedagem em nuvem) — fornece o banco de dados, a
            autenticação (login, inclusive o envio dos e-mails de confirmação de cadastro e de
            redefinição de senha) e o armazenamento dos arquivos anexados em Materiais.
            É o único fornecedor que efetivamente armazena os dados pessoais do
            projeto.
          </li>
          <li>
            <strong>ViaCEP</strong> — serviço público e gratuito de consulta de endereços
            a partir do CEP. Quando o usuário digita um CEP (opcional) no cadastro,
            apenas o CEP é enviado ao ViaCEP; a resposta (cidade/UF) é usada para
            preencher os campos automaticamente. O ViaCEP não recebe nome, e-mail ou
            qualquer outro dado que identifique a pessoa — apenas o número do CEP.
          </li>
        </ul>
        <p>Nenhum outro serviço externo recebe dados pessoais nesta fase do projeto.</p>

        <h2>5. Transferência internacional e cookies</h2>
        <p>
          A infraestrutura do Supabase pode processar/armazenar dados em servidores
          fora do Brasil, conforme a região configurada no projeto. Não usamos cookies
          de rastreamento nem de publicidade. A sessão de login é mantida pelo Supabase
          Auth usando armazenamento local do navegador, estritamente necessário para
          você continuar logado — não é usado para te rastrear em outros sites.
        </p>

        <h2>6. Retenção e descarte</h2>
        <ul>
          <li>
            Conta, perfil, registro do aceite e fator MFA: mantidos enquanto a conta
            existir. Apagados na hora quando o titular exclui a conta (tela Minha conta)
            ou quando um administrador a exclui.
          </li>
          <li>
            Logs de auditoria: <strong>90 dias</strong>. A exclusão é automática,
            executada diariamente às 03h (horário de Brasília) por uma tarefa agendada
            no próprio banco de dados (pg_cron). Um administrador também pode acionar a
            limpeza manualmente pela tela de Logs, como reforço, mas nunca de registros
            com menos de 90 dias. Se a conta for excluída antes disso, os registros já
            feitos continuam até completar os 90 dias (segurança e investigação de
            incidentes) e então são apagados pela mesma rotina.
          </li>
          <li>
            Arquivos anexados em Materiais: mantidos até serem excluídos por quem os
            enviou ou por um administrador, ou até a exclusão da conta de quem os
            enviou — a exclusão remove o arquivo também do armazenamento, não só da
            lista.
          </li>
          <li>
            Rodadas de quiz, pontos e notas/faltas: mantidos enquanto a conta existir.
            As notas de uma disciplina podem ser apagadas por você a qualquer momento;
            tudo é apagado junto com a conta.
          </li>
        </ul>

        <h3>Quem enxerga o quê</h3>
        <ul>
          <li>
            <strong>Você:</strong> todos os seus dados, na tela Minha conta, incluindo seus
            registros de atividade.
          </li>
          <li>
            <strong>Outros alunos:</strong> não veem seu perfil (nome, e-mail, curso,
            cidade) nem suas notas. Veem os materiais que você enviar (título, link e
            arquivo) e, no ranking, seu nome abreviado e seus pontos — ou &quot;Aluno
            anônimo&quot;, se você preferir.
          </li>
          <li>
            <strong>Administradores:</strong> veem os perfis de todos os usuários (para
            gerenciar contas) e os logs de auditoria. Não veem suas notas nem suas
            respostas no quiz — apenas totais gerais da turma (ex.: quantos quizzes
            foram feitos e a média de acertos por disciplina).
          </li>
        </ul>

        <h2>7. Seus direitos</h2>
        <p>Como titular dos dados, você pode solicitar, a qualquer momento:</p>
        <ul>
          <li>Confirmação de que tratamos seus dados, e acesso a eles;</li>
          <li>Correção de dados incompletos ou desatualizados;</li>
          <li>Exclusão dos dados que não sejam mais necessários;</li>
          <li>Revogação do consentimento dado para o campo opcional de cidade/estado;</li>
          <li>Oposição à exibição do seu nome no ranking;</li>
          <li>Informações sobre com quem seus dados são compartilhados.</li>
        </ul>
        <p>
          Você exerce esses direitos sozinho, dentro do site, na tela{' '}
          <strong>Minha conta</strong> (menu no topo do site, depois de entrar):
        </p>
        <ul>
          <li>
            <strong>Acesso:</strong> ver todos os dados do seu perfil, a data e a versão do
            aceite destes documentos, seus materiais enviados e seus registros de atividade,
            e baixar tudo em um arquivo (JSON);
          </li>
          <li>
            <strong>Correção:</strong> alterar nome, curso, cidade e estado (e, na tela
            Notas, as suas notas e faltas);
          </li>
          <li>
            <strong>Oposição ao ranking:</strong> desmarcar &quot;Mostrar meu nome no ranking&quot;;
          </li>
          <li>
            <strong>Revogação do consentimento:</strong> apagar cidade/estado com um clique;
          </li>
          <li>
            <strong>Eliminação:</strong> excluir a conta. Perfil, conta de acesso,
            verificação em duas etapas, materiais enviados (com os arquivos), notas,
            faltas e rodadas de quiz são apagados na hora. Os registros de auditoria já existentes são mantidos até completar 90
            dias, por segurança, e então apagados automaticamente.
          </li>
        </ul>
        <p>
          <em>
            Outras solicitações (ex.: dúvidas sobre compartilhamento) são feitas
            diretamente aos integrantes do grupo ou ao orientador.
          </em>
        </p>

        <h2>8. Segurança e resposta a incidentes</h2>
        <p>
          Senhas passam por hash (nunca texto puro). Todo acesso exige verificação em
          duas etapas (senha + código do aplicativo autenticador), e o próprio banco de
          dados recusa sessões que não concluíram essa verificação. O acesso a cada
          funcionalidade é controlado por regras de segurança no próprio banco de dados
          (Row Level Security), não apenas pela interface. Arquivos anexados não são
          públicos: só podem ser abertos por usuários logados, por links temporários
          que expiram em 1 hora. Ações relevantes ficam registradas em
          log de auditoria. Em caso de incidente de segurança, a equipe irá: identificar
          o problema, conter o acesso indevido, avaliar quais contas foram afetadas, e
          comunicar o orientador e os usuários afetados assim que possível.
        </p>

        <p className="termos-rodape-nota">
          Última atualização desta Política de Privacidade: versão 1.2, 27/10/2026. Veja
          também o <Link to="/termos">Termo de Aceite</Link>.
        </p>
      </div>
    </div>
  )
}