# Diagrama de Arquitetura (Figura 1) — versão de 05/11

Substitui a Figura 1 da monografia (seção 1.3). A figura antiga tinha Tailwind e "JWT / Go" e
não tinha Storage, pg_cron, ViaCEP nem GitHub.

**Como exportar em alta resolução:**
1. Abra https://mermaid.live
2. Apague o exemplo e cole o bloco de código abaixo (só o que está entre as linhas com três crases).
3. Menu **Actions → PNG** com escala 3x ou 4x (ou **SVG**, que nunca perde qualidade).
4. Se a figura ficar larga demais para a página, troque `flowchart LR` por `flowchart TB`
   (de cima para baixo).

```mermaid
flowchart LR
    subgraph USUARIOS["Usuários (navegador)"]
        ALUNO["Aluno"]
        ADMIN["Administrador"]
    end

    subgraph FRONT["Front-end — GitHub Pages"]
        APP["<b>EduGuru (SPA)</b><br/>React + TypeScript + Vite<br/>CSS global, HashRouter<br/><br/>Home · Login/MFA · Painel<br/>Quiz · Ranking · Notas<br/>Disciplinas · Perguntas<br/>Materiais · Moderação<br/>Perfil público · Usuários<br/>Logs · Minha conta"]
    end

    subgraph SUPA["Back-end — Supabase (BaaS)"]
        AUTH["<b>Auth</b><br/>login, MFA/TOTP,<br/>e-mails de confirmação<br/>e redefinição de senha"]
        DB[("<b>PostgreSQL</b><br/>tabelas + RLS<br/>funções security definer<br/>gatilhos de auditoria e filtro")]
        STORAGE["<b>Storage</b><br/>arquivos de materiais e<br/>imagens das perguntas<br/>(privados)"]
        CRON["<b>pg_cron</b><br/>limpeza diária<br/>dos logs (03h)"]
    end

    subgraph DEPLOY["Publicação"]
        REPO["GitHub<br/>(repositório)"]
        ACTIONS["GitHub Actions<br/>lint, testes, build"]
    end

    VIACEP["<b>ViaCEP</b><br/>API externa"]

    ALUNO --> APP
    ADMIN --> APP
    APP <-->|"HTTPS · chave pública + token JWT"| AUTH
    APP <-->|"HTTPS · Data API (REST)"| DB
    APP <-->|"HTTPS · links temporários"| STORAGE
    AUTH --- DB
    CRON --> DB
    APP -->|"HTTPS · só o CEP"| VIACEP
    REPO --> ACTIONS -->|"publica"| APP
```

**Texto da legenda (sem alteração):** "Figura 1 - Diagrama de Arquitetura do Sistema EduGuru."
