# Cultiva (powered by FIG AgroTech)

O Cultiva e uma plataforma inteligente desenvolvida para modernizar a gestao agronomica e revolucionar a forma como produtores e agronomos tomam decisoes no campo.

## Sobre o Projeto

O grande diferencial do sistema e o Motor Agronomico IA, uma inteligencia artificial embarcada que le automaticamente laudos complexos de analises de solo e extrai os dados estruturados de forma rapida e sem necessidade de digitacao manual de inumeros parametros.

Com os dados laboratoriais extraidos, o motor matematico do sistema avalia instantaneamente a fertilidade do talhao e gera um planejamento completo de safra. O sistema realiza os calculos de:
- Necessidade de calagem (toneladas de calcario por hectare) baseado no metodo de Saturacao por Bases (V%).
- Recomendacao exata de adubacao base (NPK) e de cobertura.
- Extracao e exportacao de nutrientes com base na cultura selecionada e na expectativa de produtividade.

## Principais Funcionalidades

1. Gestao de Areas
Cadastro estruturado de propriedades e talhoes, permitindo que o profissional gerencie multiplas fazendas e clientes de forma centralizada.

2. Automacao de Laudos por IA
Integracao direta com modelos de linguagem (Google Gemini) para leitura de laudos laboratoriais, convertendo texto livre ou documentos em parametros quimicos e fisicos de solo estritamente tipados.

3. Motor Agronomico
Calculos automaticos de correcao de solo e nutricao de plantas focados em maximizar a produtividade. O sistema processa os requerimentos nutricionais das principais culturas brasileiras (Soja, Milho, Feijao, Algodao, Arroz, Cafe, entre outras).

## Tecnologias Utilizadas

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase (PostgreSQL)
- NextAuth.js
- Google Generative AI (Gemini)

## Como Executar Localmente

1. Clone o repositorio.
2. Instale as dependencias executando:
   npm install
3. Configure o arquivo .env com as suas chaves de API:
   DATABASE_URL
   NEXTAUTH_SECRET
   NEXTAUTH_URL
   GEMINI_API_KEY
4. Inicie o servidor de desenvolvimento:
   npm run dev

## Hospedagem

O projeto foi arquitetado para ser "serverless-ready", sendo perfeitamente compativel com hospedagem nativa na Vercel, com banco de dados em nuvem operado pelo Supabase.
