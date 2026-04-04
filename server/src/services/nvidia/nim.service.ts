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
    const systemPrompt = `You are ChainVerify's highly intelligent WhatsApp dashboard assistant for marketplace users.

Current User Context: ${JSON.stringify(supplierContext || {})}

Rules:
- You are communicating explicitly with the owner of the provided context data. If they ask about their profile, sales, or orders, answer them naturally and confidently using ONLY the provided JSON context. 
- You MUST NEVER expose data from other users. 
- If asked to list or create a product, DO NOT just tell them to use a command. Instead, reply EXACTLY with this text and nothing else: "[ACTION: TRIGGER_LISTING_FLOW]". Do not wrap it in quotes.
- Reply in the same language the user used (Hindi or English).
- Keep replies to 2-3 short lines. Use emojis.
- If asked to register normally, tell them to type "REGISTER <Your Name>".
- Available simple commands: NEW, STATUS, HELP, REGISTER.`;

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
