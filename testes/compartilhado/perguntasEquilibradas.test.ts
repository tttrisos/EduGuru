// Confere o banco de perguntas dos scripts 14, 28 e 29 SEM precisar do banco de dados: lê os arquivos .sql.
// Motivo: antes de 16/11, a alternativa certa era a mais longa em 59 de 120 perguntas, e o aluno
// acertava "chutando a maior". Estes testes impedem que o padrão volte (nem ao contrário: a certa
// nunca ser a maior também seria um padrão).
import { describe, expect, it } from 'vitest'
// "?raw" (recurso do Vite) traz o conteúdo do arquivo como texto.
import sql14 from '../../supabase/14_perguntas_iniciais.sql?raw'
import sql28 from '../../supabase/28_perguntas_mais_disciplinas.sql?raw'
import sql29 from '../../supabase/29_perguntas_mais_5_disciplinas.sql?raw'

type Pergunta = { disciplina: string; nivel: string; enunciado: string; alternativas: string[]; explicacao: string }

// Lê os textos entre aspas simples de cada "select pg_temp.q(...)" ('' dentro do texto = aspas).
function lerTextos(trecho: string): string[] {
  const textos: string[] = []
  let i = 0
  while (i < trecho.length) {
    if (trecho[i] !== "'") {
      i++
      continue
    }
    let j = i + 1
    let valor = ''
    while (j < trecho.length) {
      if (trecho[j] === "'" && trecho[j + 1] === "'") {
        valor += "'"
        j += 2
      } else if (trecho[j] === "'") break
      else valor += trecho[j++]
    }
    textos.push(valor)
    i = j + 1
  }
  return textos
}

// Script 14: (disciplina, curso, nível, enunciado, 4 alternativas, explicação).
// Script 28: (disciplina, nível, enunciado, 4 alternativas, explicação).
function lerScript(conteudo: string, temCurso: boolean): Pergunta[] {
  const sql = conteudo.replace(/\r\n/g, '\n')
  return [...sql.matchAll(/select pg_temp\.q\(([\s\S]*?)\);\n/g)].map((m) => {
    const t = lerTextos(m[1])
    const d = temCurso ? 1 : 0
    return { disciplina: t[0], nivel: t[1 + d], enunciado: t[2 + d], alternativas: t.slice(3 + d, 7 + d), explicacao: t[7 + d] }
  })
}

const iniciais = lerScript(sql14, true)
const novas = [...lerScript(sql28, false), ...lerScript(sql29, false)]
const todas = [...iniciais, ...novas]

// Posição da correta (a 1ª alternativa) no ranking de tamanho: 1 = a mais longa, 4 = a mais curta.
// Em caso de empate, conta a favor da correta.
function posicaoDaCorreta(p: Pergunta) {
  const tamanhos = p.alternativas.map((a) => a.length)
  return 1 + tamanhos.slice(1).filter((t) => t > tamanhos[0]).length
}

describe('banco de perguntas', () => {
  it('tem 120 perguntas iniciais e 150 novas (scripts 28 e 29)', () => {
    expect(iniciais).toHaveLength(120)
    expect(novas).toHaveLength(150)
  })

  it('cada disciplina tem 15 perguntas: 6 Fácil, 5 Médio e 4 Difícil', () => {
    const disciplinas = [...new Set(todas.map((p) => p.disciplina))]
    expect(disciplinas).toHaveLength(18)
    for (const d of disciplinas) {
      const da = todas.filter((p) => p.disciplina === d)
      expect(da, d).toHaveLength(15)
      expect(da.filter((p) => p.nivel === 'Fácil'), d).toHaveLength(6)
      expect(da.filter((p) => p.nivel === 'Médio'), d).toHaveLength(5)
      expect(da.filter((p) => p.nivel === 'Difícil'), d).toHaveLength(4)
    }
  })

  it('segue as regras do cadastro (RF07-RN02 e RN06)', () => {
    for (const p of todas) {
      expect(p.enunciado.length, p.enunciado).toBeGreaterThanOrEqual(10)
      expect(p.enunciado.length, p.enunciado).toBeLessThanOrEqual(500)
      expect(new Set(p.alternativas).size, p.enunciado).toBe(4) // quatro alternativas diferentes
      expect(p.alternativas.every((a) => a.trim().length > 0), p.enunciado).toBe(true)
      expect(p.explicacao.length, p.enunciado).toBeGreaterThan(0)
      expect(p.explicacao.length, p.enunciado).toBeLessThanOrEqual(600)
    }
    // Nenhum enunciado repetido na mesma disciplina
    const chaves = todas.map((p) => `${p.disciplina}|${p.enunciado}`)
    expect(new Set(chaves).size).toBe(chaves.length)
  })

  it('a certa NÃO é sempre a mais longa (nem nunca a mais longa)', () => {
    const contagem = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>
    for (const p of todas) contagem[posicaoDaCorreta(p)]++
    const total = todas.length
    // Por acaso, cada posição teria 25%. Aceita de 15% a 35% para a mais longa...
    expect(contagem[1] / total).toBeGreaterThanOrEqual(0.15)
    expect(contagem[1] / total).toBeLessThanOrEqual(0.35)
    // ...e nenhuma posição pode concentrar quase metade das perguntas (seria outro padrão).
    for (const pos of [1, 2, 3, 4]) expect(contagem[pos] / total, `posição ${pos}`).toBeLessThanOrEqual(0.45)
  })

  it('em cada disciplina, nenhuma posição de tamanho concentra mais de 60% das perguntas', () => {
    // Quem pratica sempre a mesma disciplina não pode descobrir um padrão nela (ex.: "é sempre a 2ª maior").
    for (const d of new Set(todas.map((p) => p.disciplina))) {
      const da = todas.filter((p) => p.disciplina === d)
      for (const pos of [1, 2, 3, 4]) {
        const qtd = da.filter((p) => posicaoDaCorreta(p) === pos).length
        expect(qtd, `${d}, posição ${pos}`).toBeLessThanOrEqual(9)
      }
    }
  })

  it('a certa raramente "salta aos olhos" (30% mais longa que todas as outras)', () => {
    const destacadas = todas.filter((p) => {
      const [c, ...erradas] = p.alternativas.map((a) => a.length)
      return c >= 1.3 * Math.max(...erradas)
    })
    expect(destacadas.length / todas.length).toBeLessThanOrEqual(0.1)
  })
})
