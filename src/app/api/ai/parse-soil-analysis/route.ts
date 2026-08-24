import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada no arquivo .env" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const systemInstruction = `Você é um Agrônomo Especialista e Analista de Dados altamente treinado.
Sua tarefa é ler um texto (laudo de análise de solo, anotações de campo, pdf colado) e extrair os dados estruturados em formato JSON estrito.
Extraia as seguintes informações se disponíveis, caso não encontre algo retorne null.
Use seu conhecimento agronômico para interpretar unidades. O potássio (K) pode vir em mg/dm³ ou cmolc/dm³. Transforme vírgulas decimais em pontos decimais no output numérico.
Se o produtor informar "vou plantar soja", coloque "soja" em culturaDesejada.`;

    const schema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        dadosIniciais: {
          type: SchemaType.OBJECT,
          properties: {
            data: { type: SchemaType.STRING },
            profundidade: { type: SchemaType.STRING },
            culturaAnterior: { type: SchemaType.STRING },
            culturaDesejada: { type: SchemaType.STRING }
          }
        },
        parametrosFisicos: {
          type: SchemaType.OBJECT,
          properties: {
            argila: { type: SchemaType.NUMBER },
            silte: { type: SchemaType.NUMBER },
            areia: { type: SchemaType.NUMBER }
          }
        },
        parametrosQuimicos: {
          type: SchemaType.OBJECT,
          properties: {
            pH: { type: SchemaType.NUMBER },
            P: { type: SchemaType.NUMBER },
            K: { type: SchemaType.NUMBER },
            Ca: { type: SchemaType.NUMBER },
            Mg: { type: SchemaType.NUMBER },
            MO: { type: SchemaType.NUMBER },
            S: { type: SchemaType.NUMBER },
            CTC: { type: SchemaType.NUMBER },
            V_percent: { type: SchemaType.NUMBER },
            m_percent: { type: SchemaType.NUMBER }
          }
        }
      }
    };

    // Use gemini-3.6-flash as instructed by the API
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      }
    });

    const response = await model.generateContent(`Analise este texto:\n\n${text}`);
    const resultText = response.response.text();
    
    if (!resultText) {
      throw new Error("Empty response from Gemini");
    }

    const jsonResult = JSON.parse(resultText);

    return NextResponse.json(jsonResult);
  } catch (error) {
    console.error("Error parsing soil analysis with AI:", error);
    return NextResponse.json(
      { error: "Failed to parse analysis", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
