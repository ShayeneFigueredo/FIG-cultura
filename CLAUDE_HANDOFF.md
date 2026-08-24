# FIG AgroTech - Cultiva (Project Handoff)

Bem-vindo(a), Claude! Este documento foi criado para te dar o contexto completo do projeto "Cultiva" até o momento, para que você possa continuar o desenvolvimento perfeitamente com o usuário.

## 🛠️ Stack Tecnológico
- **Framework:** Next.js 16.3 (App Router, React 19)
- **Banco de Dados:** SQLite (via Prisma ORM)
- **Estilização:** Tailwind CSS (v4) com estética Premium (Glassmorphism, Dark Mode, cores ricas)
- **Inteligência Artificial:** Groq SDK (Modelo `qwen/qwen3.6-27b`)
- **Ícones:** Lucide React

## 📦 Estrutura do Projeto e Módulos Implementados

### 1. Gestão de Áreas (Propriedades e Talhões)
- **Rotas:** `/dashboard/propriedades` e `/dashboard/propriedades/[id]`
- **Status:** Completo. Permite cadastrar fazendas (Properties) e seus respectivos talhões (Fields). 

### 2. Análise de Solo e Planejamento (Planilha)
- **Rotas:** `/dashboard/analises` e `/dashboard/analises/novo`
- **Componentes:** `src/components/analises/DataGrid.tsx`
- **Status:** Interface e Banco de Dados implementados.
- **Detalhes:** 
  - A rota `/dashboard/analises` possui um `DataGrid` estilizado como uma planilha complexa. Ela lista os dados de solo, diagnósticos de fertilidade, correção e planejamento de safra.
  - Possui scroll horizontal e colunas congeladas (sticky).

### 3. Integração com Inteligência Artificial (Groq)
- **Rota Backend:** `/api/ai/parse-soil-analysis/route.ts`
- **Contexto:** Os engenheiros agrônomos podem colar laudos laboratoriais inteiros ou anotações em texto livre. A rota da API se comunica com a Groq (via `groq-sdk`) passando um *System Prompt* robusto focado em agronomia. A IA devolve um JSON estruturado.
- **Frontend:** Em `/dashboard/analises/novo`, há uma área de texto chamada "Preenchimento Mágico". Ao enviar, a IA preenche instantaneamente o formulário do usuário (State `formData`) para revisão antes de salvar.

## 🗄️ Modelo de Dados (Prisma)
O schema (`prisma/schema.prisma`) possui relacionamentos complexos:
- `User` -> 1:N -> `Property`
- `Property` -> 1:N -> `Field` (Talhões)
- `Field` -> 1:N -> `SoilAnalysis`
- `SoilAnalysis` possui relações com `PhysicalCharacteristics`, `CropPlanning`, `SoilParameter`, `NutrientRecommendation` e `FertilizationStrategy`.

## ⚙️ Configurações Importantes
- **Variáveis de Ambiente (`.env`):**
  - `DATABASE_URL`: Aponta para o `dev.db` (SQLite local).
  - `GROQ_API_KEY`: Necessária para fazer o parser de inteligência artificial funcionar.
- **Bug Conhecido (Next.js + Prisma no Windows):** Ao fazer alterações no `schema.prisma`, o comando `npx prisma generate` frequentemente dá erro `EPERM` porque o servidor de dev do Next.js bloqueia os binários. **Solução:** Parar o `npm run dev`, rodar o generate e iniciar o servidor novamente.

## 🚀 Próximos Passos Sugeridos
1. **Salvar no Banco:** O formulário em `/dashboard/analises/novo` atualmente preenche o *state* usando IA perfeitamente, mas a função `handleSave()` tem apenas um mock visual. O próximo passo é criar uma *Server Action* para persistir o `SoilAnalysis` e todas as suas tabelas filhas.
2. **Dashboard de Diagnósticos:** Adicionar gráficos e comparativos históricos entre as análises.

Bom trabalho!
