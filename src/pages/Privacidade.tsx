import { Link } from 'react-router-dom'

// Documento vivo, versão 1.0 (28/09/2026). Separado do Termo de Aceite
// (TermoDeAceite.tsx) por decisão do orientador e coorientador.
export default function Privacidade() {
  return (
    <div className="termos-tela">
      <div className="termos-conteudo cartao">
        <Link to="/login" className="termos-voltar">
          ← Voltar
        </Link>

        <p className="aviso">
          Versão 1.0 — 28/09/2026. Documento vivo: será atualizado conforme novas
          funcionalidades (quiz, pontuação, ranking) entrarem no projeto. Finalidade
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
            <strong>Conteúdo da plataforma:</strong> disciplinas, perguntas de quiz e
            materiais de estudo cadastrados por administradores, incluindo arquivos
            (PDF/DOCX, até 5 MB) que os usuários decidam anexar.
          </li>
          <li>
            <strong>Registros de auditoria:</strong> login, tentativas de login malsucedidas,
            logout, e criação/edição/exclusão de disciplinas, perguntas e materiais —
            sempre associados a quem realizou a ação e quando.
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
                <td>Curso</td>
                <td>Mostrar conteúdo relevante ao curso do aluno</td>
                <td>Execução de contrato</td>
                <td>Enquanto a conta existir</td>
              </tr>
              <tr>
                <td>Cidade/estado (via CEP, opcional)</td>
                <td>Enriquecer o perfil para funcionalidades sociais/regionais (ex.: ranking por região)</td>
                <td>Consentimento (o próprio ato de preencher um campo opcional)</td>
                <td>Enquanto a conta existir, ou até o usuário remover a informação</td>
              </tr>
              <tr>
                <td>Perguntas, disciplinas, materiais</td>
                <td>Funcionamento do quiz e da biblioteca de materiais</td>
                <td>Execução de contrato / legítimo interesse educacional</td>
                <td>Enquanto o conteúdo for mantido pela administração</td>
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
            autenticação (login) e o armazenamento dos arquivos anexados em Materiais.
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
          <li>Conta e perfil: mantidos enquanto a conta estiver ativa.</li>
          <li>
            Logs de auditoria: <strong>90 dias</strong>, com exclusão automática via
            rotina que pode ser executada por um administrador (função implementada no
            banco de dados).
          </li>
          <li>
            Arquivos anexados em Materiais: mantidos até serem excluídos por quem os
            enviou ou por um administrador — a exclusão remove o arquivo também do
            armazenamento, não só da lista.
          </li>
        </ul>

        <h2>7. Seus direitos</h2>
        <p>Como titular dos dados, você pode solicitar, a qualquer momento:</p>
        <ul>
          <li>Confirmação de que tratamos seus dados, e acesso a eles;</li>
          <li>Correção de dados incompletos ou desatualizados;</li>
          <li>Exclusão dos dados que não sejam mais necessários;</li>
          <li>Revogação do consentimento dado para o campo opcional de cidade/estado;</li>
          <li>Informações sobre com quem seus dados são compartilhados.</li>
        </ul>
        <p>
          <em>
            Nesta fase acadêmica, essas solicitações são feitas diretamente aos
            integrantes do grupo ou ao orientador. Uma tela própria para o usuário
            exercer esses direitos sozinho, dentro do site, é um próximo passo do
            projeto (ainda não implementada nesta entrega).
          </em>
        </p>

        <h2>8. Segurança e resposta a incidentes</h2>
        <p>
          Senhas passam por hash (nunca texto puro). O acesso a cada funcionalidade é
          controlado por regras de segurança no próprio banco de dados (Row Level
          Security), não apenas pela interface. Ações relevantes ficam registradas em
          log de auditoria. Em caso de incidente de segurança, a equipe irá: identificar
          o problema, conter o acesso indevido, avaliar quais contas foram afetadas, e
          comunicar o orientador e os usuários afetados assim que possível.
        </p>

        <p className="termos-rodape-nota">
          Última atualização desta Política de Privacidade: versão 1.0, 28/09/2026. Veja
          também o <Link to="/termos">Termo de Aceite</Link>.
        </p>
      </div>
    </div>
  )
}