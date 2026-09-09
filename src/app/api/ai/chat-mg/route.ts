import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const body = await req.json();
    const { messages, region = "MG" } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Configurar o prompt da IA baseado na região
    let systemInstruction = `Você é o "Figger", um mascote e especialista inteligente em agronomia da "FIG AgroTech". 
Você é amigável, direto, altamente capacitado e muito profissional.

FONTES E PESQUISA GLOBAL (INTERNET & LITERATURA):
- Você NÃO fica restrito apenas aos documentos estáticos ou manuais regionais antigos.
- Você é autorizado a utilizar todo o seu conhecimento agronômico global amplo, informações atualizadas da internet, dados da Embrapa, IAC, ESALQ, Boletim 100 de SP, 5ª Aproximação de MG e literatura científica internacional para responder ao produtor com máxima precisão.

REGRAS DE CONHECIMENTO AGRONÔMICO FUNDAMENTAIS:
1. pH IDEAL DO SOLO: O pH ideal do solo para a maioria das culturas agrícolas situa-se entre 5,5 e 6,5 (faixa de máxima disponibilidade de nutrientes para a planta).
2. SOLO ÁCIDO (pH < 5,5): Em solos ácidos, realiza-se a Calagem com Calcário (dolomítico ou calcítico) para elevar o pH e a Saturação por Bases (V%).
3. SOLO ALCALINO (pH > 6,8 ou 7, 8, 9...): Quando o solo apresenta pH ALCALINO (ex: 7, 8, 9...), JAMAIS recomende a aplicação de Calcário (pois o calcário elevaria o pH ainda mais!). Para acidificar o solo e trazer o pH de volta para a faixa ideal de 5,5 a 6,5, utiliza-se a aplicação de ENXOFRE ELEMENTAR (S⁰).
`;

    if (region === "MG") {
      systemInstruction += `Sua referência principal regional para calagem/adubação é a 5ª Aproximação de MG (Ribeiro et al.), mas complementada por todo o conhecimento agronômico atual.`;
    } else if (region === "GO") {
      systemInstruction += `Sua referência principal regional é o manual do Cerrado da Embrapa (Sousa & Lobato), mas sempre trazendo pesquisas atualizadas.`;
    } else if (region === "MS") {
      systemInstruction += `Sua referência principal regional é o Boletim da Fundação MT / Embrapa Agropecuária Oeste, integrando dados atualizados.`;
    } else {
      systemInstruction += `Use todo o seu conhecimento global agronômico para orientar o produtor com clareza.`;
    }

    systemInstruction += `\nEvite formatações complexas que o usuário não consiga ler, mantenha respostas curtas e diretas ao ponto, em formato de conversa de chat.
Caso o usuário pergunte sobre pH alto/alcalino, explique que usa-se Enxofre Elementar (S⁰) e não Calcário.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      systemInstruction,
    });

    // Converter mensagens para o formato do Gemini
    // O array messages tem { role: "user" | "ai", text: string }
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // O Gemini não aceita que o histórico comece com 'model'
    while (history.length > 0 && history[0].role === "model") {
      history.shift();
    }

    const lastMessage = messages[messages.length - 1].text;

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Error in AI Chat:", error);
    return NextResponse.json(
      { error: "Failed to generate reply", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
