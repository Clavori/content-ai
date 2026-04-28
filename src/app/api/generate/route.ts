import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  blog: `Crie um post de blog completo e envolvente sobre o tema informado. O post deve ter:
- Um título chamativo e criativo
- Uma introdução que prende a atenção do leitor
- Desenvolvimento com subtítulos, parágrafos bem estruturados
- Dicas, exemplos ou dados relevantes
- Uma conclusão com call-to-action
Use formatação com markdown (títulos, negrito, listas).`,

  instagram: `Crie uma legenda de Instagram envolvente sobre o tema informado. A legenda deve ter:
- Uma abertura que para o scroll
- Texto cativante e pessoal
- Quebra de linhas para facilitar a leitura
- Uma call-to-action clara
- 10 a 15 hashtags relevantes e estratégicas
Use emojis de forma moderada e estratégica.`,

  email: `Crie um e-mail marketing profissional sobre o tema informado. O e-mail deve ter:
- Um assunto irresistível (com 2 opções de teste A/B)
- Pre-header persuasivo
- Saudação personalizada
- Corpo do e-mail com estrutura AIDA (Atenção, Interesse, Desejo, Ação)
- Botão/CTA claro e direto
- P.S. com reforço de oferta ou urgência
Tom profissional mas acessível.`,

  youtube: `Crie um roteiro completo para vídeo do YouTube sobre o tema informado. O roteiro deve ter:
- Título do vídeo otimizado para busca
- Thumbnail suggestion (descrição visual)
- Hook inicial (primeiros 10 segundos para reter o espectador)
- Introdução do canal
- Desenvolvimento com timestamps
- Seção de perguntas engajantes para comentários
- Call-to-action (inscreva-se, curta, comente)
- Encerramento com teaser para o próximo vídeo`,

  linkedin: `Crie um post para LinkedIn sobre o tema informado. O post deve ter:
- Uma abertura forte que gera reflexão
- Conteúdo com valor profissional e insights
- Storytelling ou dados que reforçam o argumento
- Call-to-action que incentiva comentários
- 3 a 5 hashtags profissionais
Tom profissional, autoral e que demonstre expertise.`,

  produto: `Crie uma descrição de produto persuasiva sobre o tema informado. A descrição deve ter:
- Título do produto
- Headline que desperta desejo
- Descrição dos benefícios (não apenas características)
- Como o produto resolve problemas do cliente
- Prova social / gatilhos de confiança
- Especificações técnicas de forma escaneável
- Garantia e argumentos de risco zero
- CTA de compra urgente`,
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  profissional: "Use um tom profissional, formal e confiável. Linguagem corporativa mas acessível.",
  casual: "Use um tom casual, descontraído e amigável. Como se estivesse conversando com um amigo.",
  criativo: "Use um tom criativo, ousado e fora da caixa. Surpreenda com metáforas e analogias inesperadas.",
  persuasivo: "Use um tom persuasivo e convencedor. Aplique gatilhos mentais, urgência e provas sociais.",
  educativo: "Use um tom educativo e didático. Explique conceitos de forma clara, com exemplos práticos.",
};

// Try ZAI SDK first (sandbox), fall back to Gemini API (production)
async function generateWithZAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });
  return completion.choices[0]?.message?.content || "Não foi possível gerar o conteúdo.";
}

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Gemini API error:", response.status, errorData);
    throw new Error(`Erro na API do Gemini (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar o conteúdo.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, topic, tone } = body;

    if (!contentType || !topic || !tone) {
      return NextResponse.json(
        { error: "Tipo de conteúdo, tema e tom são obrigatórios." },
        { status: 400 }
      );
    }

    const contentPrompt = CONTENT_TYPE_PROMPTS[contentType];
    const toneInstruction = TONE_INSTRUCTIONS[tone];

    if (!contentPrompt || !toneInstruction) {
      return NextResponse.json(
        { error: "Tipo de conteúdo ou tom inválido." },
        { status: 400 }
      );
    }

    const systemPrompt = `Você é um especialista em marketing de conteúdo e copywriting. Você cria conteúdo de alta qualidade em português do Brasil que engaja, converte e entrega valor. ${toneInstruction}`;
    const userPrompt = `${contentPrompt}\n\nTema: ${topic}\n\nGere o conteúdo agora em português do Brasil.`;

    // Try ZAI SDK first (works in sandbox), then Gemini (works in production)
    let generatedContent: string;
    try {
      generatedContent = await generateWithZAI(systemPrompt, userPrompt);
    } catch {
      console.log("ZAI SDK não disponível, usando Gemini API...");
      generatedContent = await generateWithGemini(systemPrompt, userPrompt);
    }

    // Save to history
    const saved = await db.contentHistory.create({
      data: {
        contentType,
        topic,
        tone,
        content: generatedContent,
      },
    });

    return NextResponse.json({
      id: saved.id,
      content: generatedContent,
      contentType,
      topic,
      tone,
      createdAt: saved.createdAt,
    });
  } catch (error: unknown) {
    console.error("Error generating content:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao gerar conteúdo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
