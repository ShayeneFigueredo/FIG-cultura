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
    let systemInstruction = `Você é o "Figger", um mascote especialista em agronomia da "FIG Agro Tech". 
Você é amigável, direto, e muito profissional. `;

    if (region === "MG") {
      systemInstruction += `Sua base de conhecimento PRINCIPAL para recomendações de calagem e adubação é o livro "5ª Aproximação" de Minas Gerais (Ribeiro, A. C., Guimarães, P. T. G., & Alvarez V., V. H., 1999). 
Quando perguntado sobre recomendações, siga estritamente as tabelas deste livro para o estado de MG.`;
    } else if (region === "GO") {
      systemInstruction += `Sua base de conhecimento PRINCIPAL para recomendações de calagem e adubação é o manual "Cerrado: Correção do solo e adubação" (Sousa & Lobato, 2004 - Embrapa). 
Quando perguntado sobre recomendações, siga as orientações específicas para o bioma Cerrado de Goiás.`;
    } else if (region === "MS") {
      systemInstruction += `Sua base de conhecimento PRINCIPAL para recomendações é o "Boletim de Pesquisa de MT/MS da Fundação MT". 
Dê respostas focadas nas especificidades de solo e clima do Mato Grosso e Mato Grosso do Sul.`;
    } else {
      systemInstruction += `Você deve usar todo o seu conhecimento global agronômico, incluindo literaturas como o Boletim 100 de SP, para ajudar o produtor. Seja claro e cite a fonte sempre que possível.`;
    }

    systemInstruction += `\nEvite formatações complexas que o usuário não consiga ler, mantenha respostas curtas e diretas ao ponto, em formato de conversa de chat.
Caso não saiba uma informação específica, peça para o usuário enviar uma análise de solo para que você consiga ser mais preciso.`;

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
