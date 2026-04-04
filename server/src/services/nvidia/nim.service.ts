import OpenAI from 'openai';

const nim = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_NIM_API_KEY!,
});

const MODEL = process.env.NIM_MODEL || 'meta/llama-3.1-8b-instruct';

// ─────────────────────────────────────────────
// Intelligent WhatsApp reply
// ─────────────────────────────────────────────
export async function generateWhatsAppReply(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  supplierContext: Record<string, any> | null
): Promise<string> {
  try {
    const systemPrompt = `You are ChainVerify's highly intelligent WhatsApp dashboard assistant for marketplace suppliers.

Current User & Dashboard Context: ${JSON.stringify(supplierContext || {})}

Rules:
- You have access to the user's live dashboard data. If they ask about their name, profile, total sales, or recent orders, answer them naturally using the context above.
- Reply in the same language the supplier used (Hindi or English).
- Keep replies short — max 3-4 lines for WhatsApp. Use emojis naturally.
- Be an empowering assistant to small business owners.
- If asked to list a product, say "To start, simply reply with the command: NEW".
- If asked to register normally, tell them to type "REGISTER <Your Name>".
- Never invent product details. Rely ONLY on the context provided.
- Available commands: NEW, STATUS, HELP, REGISTER.`;

    const response = await nim.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || getHelpFallback();
  } catch (error) {
    console.error('NIM API error:', error);
    return getHelpFallback();
  }
}

// ─────────────────────────────────────────────
// Improve product description
// ─────────────────────────────────────────────
export async function improveProductDescription(
  rawDescription: string,
  category: string
): Promise<string> {
  try {
    const response = await nim.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Improve this product description for an Indian marketplace.
Category: ${category}
Raw description: ${rawDescription}

Write a better 2-3 sentence description. Be specific, mention quality indicators,
appeal to both Indian and international buyers.
Return only the improved description, nothing else.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content || rawDescription;
  } catch (error) {
    console.error('NIM description improvement error:', error);
    return rawDescription;
  }
}

// ─────────────────────────────────────────────
// Fraud detection on product listing
// ─────────────────────────────────────────────
export async function analyzeProductForFraud(productData: {
  title: string;
  description?: string;
  priceInr: number;
  category: string;
}): Promise<{ riskScore: number; flags: string[]; recommendation: 'approve' | 'review' | 'reject' }> {
  try {
    const response = await nim.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Analyze this product listing for potential fraud indicators.
Product: ${JSON.stringify(productData)}

Return JSON only — no extra text:
{ "riskScore": 0-100, "flags": ["flag1"], "recommendation": "approve|review|reject" }`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    return { riskScore: 50, flags: [], recommendation: 'review' };
  }
}

function getHelpFallback(): string {
  return 'ChainVerify Commands:\n\nNEW — List a product\nSTATUS — Your listings\nHELP — Show menu\n\nOr visit chainverify.app';
}
