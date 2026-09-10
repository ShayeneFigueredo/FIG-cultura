import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada no arquivo .env" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const { text, fileBase64, mimeType } = await req.json();

    if (!text && !fileBase64) {
      return NextResponse.json({ error: "Nenhum arquivo ou texto foi fornecido para análise." }, { status: 400 });
    }

    const systemInstruction = `Você é um Agrônomo Especialista e Extrator de Dados de Laudos Agrícolas com precisão cirúrgica.
Sua tarefa é analisar o laudo de solo fornecido (em documento PDF, imagem de tabela ou texto) e extrair EXATAMENTE os parâmetros laboratoriais numéricos e cadastrais encontrados.

REGRAS CRÍTICAS DE PREENCHIMENTO E PRECISÃO:
1. NUNCA invente, infira ou preencha valores aleatórios ou simulados.
2. Se um parâmetro químico ou físico (pH, P, K, Ca, Mg, Argila, Silte, Areia, V%, CTC, etc.) NÃO estiver explicitamente presente no laudo, retorne null para aquele campo. Deixe-o rigorosamente em branco.
3. Se a informação sobre data da coleta, profundidade, cultura anterior ou cultura desejada não constar no laudo, retorne null.
4. Transcreva os valores numéricos com precisão decimal exata. Substitua vírgula por ponto (ex: 5,4 -> 5.4).
5. Interprete unidades agronômicas (mg/dm³, cmolc/dm³, g/kg, %, etc.) e converta se necessário para os padrões normais de interpretação.`;

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
            Al: { type: SchemaType.NUMBER },
            H_Al: { type: SchemaType.NUMBER },
            MO: { type: SchemaType.NUMBER },
            S: { type: SchemaType.NUMBER },
            CTC: { type: SchemaType.NUMBER },
            V_percent: { type: SchemaType.NUMBER },
            m_percent: { type: SchemaType.NUMBER }
          }
        }
      }
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.0,
      }
    });

    const parts: any[] = [];

    if (fileBase64 && mimeType) {
      const cleanBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      });
    }

    if (text) {
      parts.push({ text: `Texto/Anotações adicionais da análise:\n${text}` });
    } else {
      parts.push({ text: "Analise o laudo de solo em anexo e extraia rigorosamente todos os parâmetros encontrados." });
    }

    const response = await model.generateContent(parts);
    const resultText = response.response.text();
    
    if (!resultText) {
      throw new Error("Resposta vazia da IA.");
    }

    const jsonResult = JSON.parse(resultText);

    return NextResponse.json(jsonResult);
  } catch (error) {
    console.error("Error parsing soil analysis with AI:", error);
    return NextResponse.json(
      { error: "Falha ao processar análise com IA", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
