-- ============================================================
-- EduGuru — 32: explicações do quiz que ainda citavam "notas"
--   Depois que notas e faltas saíram do sistema (script 30), três explicações de
--   perguntas continuavam dizendo que o EduGuru "testa o cálculo das notas" ou
--   que "cada aluno lê só as próprias notas" — o que não é mais verdade.
--   Este script troca SÓ o texto dessas três explicações (tabela gabaritos).
--   Não mexe em enunciado, alternativas, gabarito nem nos pontos já ganhos.
--   Os scripts 14 e 29 já foram corrigidos com o mesmo texto, então um banco
--   novo, criado do zero, sai certo sem precisar deste script.
-- Rodar depois do 31. Pode ser rodado de novo (só reescreve o mesmo texto).
-- ============================================================


-- Cada linha: disciplina + enunciado (identificam a pergunta) e a explicação nova.
-- O "join" com disciplinas evita mexer em outra pergunta com o mesmo enunciado.
with novas (disciplina, enunciado, explicacao) as (
  values
    ('Banco de Dados',
     'No PostgreSQL (usado pelo Supabase), qual recurso **restringe quais linhas** cada usuário pode ler ou alterar?',
     'O RLS (Row Level Security) aplica regras linha a linha. O EduGuru usa esse recurso para que cada aluno leia só as próprias rodadas de quiz.'),
    ('Engenharia de Software',
     'Um teste que verifica uma **função isolada**, como o cálculo da média, é um teste de quê?',
     'O teste de unidade verifica a menor parte do código, sem tela nem banco. O EduGuru testa assim o cálculo da afinidade da Bússola.'),
    ('Implementação e Testes de Projetos de Software',
     'O que é um **teste unitário**?',
     'O teste unitário confere uma função ou módulo sozinho, sem banco nem rede, por isso é rápido. O EduGuru testa assim o cálculo da evolução do aluno, por exemplo.')
)
update public.gabaritos g
set explicacao = n.explicacao
from novas n
join public.disciplinas d on d.nome = n.disciplina
join public.perguntas p on p.disciplina_id = d.id and p.enunciado = n.enunciado
where g.pergunta_id = p.id;


-- Conferência: deve voltar 0 (nenhuma explicação falando das notas do EduGuru)
select count(*) as explicacoes_que_ainda_citam_notas
from public.gabaritos
where explicacao ilike '%EduGuru%nota%';
