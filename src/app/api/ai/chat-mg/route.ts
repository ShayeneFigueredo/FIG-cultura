import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const body = await req.json();
    const { messages, region = "MG", analysisId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Buscar análises de solo do usuário no banco de dados para dar contexto completo ao Figger
    const session = await getServerSession(authOptions);
    let analysesContext = "";

    if (session?.user?.id) {
      const userAnalyses = await prisma.soilAnalysis.findMany({
        where: {
          field: {
            property: {
              userId: session.user.id,
            },
          },
        },
        include: {
          field: {
            include: {
              property: true,
            },
          },
          parameters: true,
          physicalChars: true,
          recommendations: true,
          strategies: {
            include: {
              items: {
                include: {
                  fertilizer: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 15,
      });

      if (userAnalyses.length > 0) {
        analysesContext = "\n--- DADOS DAS ANÁLISES DE SOLO DO USUÁRIO NA PLATAFORMA CULTIVA ---\n";
        
        userAnalyses.forEach((analysis, idx) => {
          const isSelected = analysisId && analysis.id === analysisId;
          const params = analysis.parameters
            .map((p) => `${p.element}: ${p.value} ${p.unit}`)
            .join(", ");
          
          const recs = analysis.recommendations
            .map((r) => `${r.nutrient}: ${r.recommendedDose} kg/ha`)
            .join(", ");

          const strat = analysis.strategies[0]?.items
            .map((it) => `${it.fertilizer.name} (${it.doseKgHa} kg/ha)`)
            .join(", ");

          analysesContext += `\n[ANÁLISE ${idx + 1}${isSelected ? " - EM FOCO ATUAL" : ""}] (ID: ${analysis.id})
- Fazenda: ${analysis.field.property.name} (${analysis.field.property.city || "Cidade não inf."}/${analysis.field.property.state || "UF"})
- Talhão: ${analysis.field.name} | Área: ${analysis.field.area} ha
- Cultura Desejada: ${analysis.culturaDesejada || analysis.field.crop || "Não definida"} | Produtividade Alvo: ${analysis.produtividade ? `${analysis.produtividade} sc/ha ou t/ha` : "Padrão"}
- Data da Coleta: ${new Date(analysis.date).toLocaleDateString("pt-BR")} | Profundidade: ${analysis.depth || "0-20 cm"}
- Parâmetros Químicos: ${params || "Nenhum parâmetro extraído"}
- Textura: ${analysis.physicalChars?.classeTextural || "Não informada"} (Argila: ${analysis.physicalChars?.argila ?? "N/D"}%, Silte: ${analysis.physicalChars?.silte ?? "N/D"}%, Areia: ${analysis.physicalChars?.areia ?? "N/D"}%)
- Recomendações Nutricionais Calculadas: ${recs || "Não calculadas"}
- Estratégia de Fertilizantes Sugerida: ${strat || "Não definida"}
`;
        });
        analysesContext += "\n--- FIM DOS DADOS DAS ANÁLISES ---\n";
      } else {
        analysesContext = "\nO usuário ainda não possui análises de solo cadastradas na plataforma. Incentive-o a cadastrar suas primeiras análises para receber diagnósticos e planos de adubação personalizados.\n";
      }
    }

    // Configurar as instruções do Figger
    let systemInstruction = `Você é o "Figger", o especialista inteligente em agronomia da plataforma "Cultiva" (FIG AgroTech). 
Você é amigável, direto, altamente capacitado, acolhedor e muito profissional.

ESCOPO EXCLUSIVO DA PLATAFORMA CULTIVA:
- O CULTIVA é uma plataforma especializada exclusivamente em CORREÇÃO E ADUBAÇÃO DO SOLO (calagem, gessagem, manejo de acidez e alcalinidade, adubação de plantio e cobertura com NPK e micronutrientes, fertilidade e química do solo).
- O foco do Cultiva é 100% no solo, na fertilidade e na nutrição mineral de plantas via solo.
- Se o usuário perguntar sobre temas fora desse escopo (como defensivos agrícolas, inseticidas, fungicidas, pragas, doenças da parte aérea ou maquinários pesados), responda cordialmente explicando que o Cultiva é uma plataforma focada exclusivamente na fertilidade, correção e nutrição do solo, e ofereça orientações pertinentes à nutrição do solo para a cultura em questão.

ACESSO ÀS ANÁLISES DE SOLO DA PLATAFORMA:
- Você tem ACESSO DIRETO E INTEGRADO aos dados das análises de solo cadastradas pelo produtor na plataforma Cultiva listados abaixo.
- Você pode consultar, interpretar, comparar e explicar detalhadamente cada análise de solo, tirando dúvidas sobre os resultados laboratoriais (pH, saturação por bases V%, fósforo, potássio, cálcio, magnésio, CTC, etc.), explicando o porquê de cada dose de calcário, gesso ou fertilizante recomendada, e dando dicas práticas para o manejo da fertilidade do solo de cada talhão.
${analysesContext}

REGRA OBRIGATÓRIA DE FORMATAÇÃO (SEM ASTERISCOS):
- NUNCA use asteriscos (*) ou duplos asteriscos (**) em suas mensagens.
- Não use formatação markdown de negrito com asteriscos nem listas com asteriscos.
- Para destacar termos importantes, use LETRAS MAIÚSCULAS ou aspas.
- Para listas ou itens, use travessão (-) ou números (1., 2.).
- Mantenha respostas com parágrafos claros, diretas ao ponto e em formato agradável de conversa de chat.

FONTES E PESQUISA GLOBAL (INTERNET & LITERATURA):
- Você utiliza todo o seu conhecimento agronômico global amplo, informações atualizadas da internet, dados da Embrapa, IAC, ESALQ, Boletim 100 de SP, 5ª Aproximação de MG e literatura científica internacional para responder ao produtor com máxima precisão.

REGRAS DE CONHECIMENTO AGRONÔMICO FUNDAMENTAIS:
1. pH IDEAL DO SOLO: O pH ideal do solo para a maioria das culturas agrícolas situa-se entre 5,5 e 6,5 (faixa de máxima disponibilidade de nutrientes para a planta).
2. SOLO ÁCIDO (pH < 5,5): Em solos ácidos, realiza-se a Calagem com Calcário (dolomítico ou calcítico) para elevar o pH e a Saturação por Bases (V%).
3. SOLO ALCALINO (pH > 6,8 ou 7, 8, 9...): Quando o solo apresenta pH ALCALINO (ex: 7, 8, 9...), JAMAIS recomende a aplicação de Calcário (pois o calcário elevaria o pH ainda mais!). Para acidificar o solo e trazer o pH de volta para a faixa ideal de 5,5 a 6,5, utiliza-se a aplicação de ENXOFRE ELEMENTAR (S0).
`;

    if (region === "MG") {
      systemInstruction += `\nSua referência principal regional para calagem e adubação é a 5ª Aproximação de MG (Ribeiro et al.), complementada por todo o conhecimento agronômico atual.`;
    } else if (region === "GO") {
      systemInstruction += `\nSua referência principal regional é o manual do Cerrado da Embrapa (Sousa & Lobato), integrando dados e pesquisas atualizadas.`;
    } else if (region === "MS") {
      systemInstruction += `\nSua referência principal regional é o Boletim da Fundação MT / Embrapa Agropecuária Oeste, integrando dados atualizados.`;
    } else {
      systemInstruction += `\nUse todo o seu conhecimento agronômico para orientar o produtor com clareza e precisão.`;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      systemInstruction,
    });

    // Converter mensagens para o formato do Gemini
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.text.replaceAll("*", "") }],
    }));

    // O Gemini não aceita que o histórico comece com 'model'
    while (history.length > 0 && history[0].role === "model") {
      history.shift();
    }

    const lastMessage = messages[messages.length - 1].text.replaceAll("*", "");

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage(lastMessage);
    // Garantir que a resposta da IA não contenha nenhum caractere de asterisco
    let responseText = result.response.text();
    responseText = responseText.replaceAll("*", "");

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Error in AI Chat:", error);
    return NextResponse.json(
      { error: "Failed to generate reply", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
