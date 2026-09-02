# EduGuru

Plataforma Web acadêmica gamificada para gerenciamento, acompanhamento e personalização da jornada de aprendizagem.

## Sobre o projeto

O EduGuru é um projeto desenvolvido como Projeto Final de Curso (PFC/TCC) do curso de Sistemas de Informação da Universidade de Mogi das Cruzes (UMC).

Diferente de sistemas acadêmicos tradicionais que funcionam apenas como repositórios passivos, o objetivo do EduGuru é combater o desengajamento através da gamificação. A plataforma centraliza o acompanhamento de notas e faltas, mas utiliza um **sistema de quizzes interativos** como principal mecanismo de engajamento. Ao estudar e responder aos quizzes, o aluno ganha pontos, participa de rankings e recebe recomendações direcionadas de materiais de estudo para suprir suas dificuldades.

## Público-Alvo

O escopo inicial da aplicação é voltado exclusivamente para estudantes da UMC dos seguintes cursos de tecnologia:
- Sistemas de Informação
- Análise e Desenvolvimento de Sistemas (ADS)
- Engenharia de Software

## Principais Funcionalidades

- **Dashboard Acadêmico:** Registro manual e acompanhamento claro de notas (M1, M2, médias) e controle do limite de faltas.
- **Quiz Gamificado:** Perguntas categorizadas por curso, disciplina, assunto e nível de dificuldade (iniciante, intermediário, avançado).
- **Pontuação e Rankings:** Sistema de pontos por acerto, alimentando um Ranking Global e um Ranking de Amigos.
- **O "Guru" (Recomendações):** Sistema leve de indicação de conteúdos de estudo com base nas lacunas de conhecimento identificadas nos quizzes.
- **Gestão de Materiais:** Organização de PDFs, links e anotações.

## Escopo e Plataformas

O projeto será desenvolvido como uma aplicação Web responsiva, projetada para funcionar de forma fluida em computadores, notebooks, tablets e celulares através do navegador. 

O desenvolvimento de aplicativos mobile nativos (Android/iOS) ou aplicações desktop não faz parte do escopo atual de implementação deste PFC.

## Tecnologias e Arquitetura

O projeto utiliza uma arquitetura moderna baseada em serviços de Backend-as-a-Service (BaaS):

- **Front-end:** React, TypeScript, Tailwind CSS (Hospedado no GitHub Pages).
- **Back-end e Autenticação:** Supabase (Auth e Data API nativa).
- **Banco de Dados:** PostgreSQL (gerenciado pelo Supabase com Row Level Security).
- **Controle de Versão:** Git e GitHub.

## Status do Projeto

Em desenvolvimento ativo. 
(Fase atual: Configuração de arquitetura e estruturação do ambiente).
