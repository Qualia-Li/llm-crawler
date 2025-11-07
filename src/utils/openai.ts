/**
 * Azure OpenAI utility for brand extraction
 */
import { AzureOpenAI } from 'openai';
import { config } from 'dotenv';

config({ path: '.env.local' });

export const client4o = new AzureOpenAI({
    apiVersion: "2024-08-01-preview",
    endpoint: "https://drlambda.openai.azure.com/",
    apiKey: process.env.AZURE_OPENAI_KEY_USEAST,
});

/**
 * Extract brand names from an answer text using GPT-4o
 * @param answer - The answer text to analyze
 * @param predefinedBrands - Optional list of predefined brands to look for
 * @returns Array of brand names mentioned in the answer
 */
export async function extractBrands(answer: string, predefinedBrands: string[] = []): Promise<string[]> {
    try {
        const prompt = `You are a brand extraction expert. Extract all brand names, company names, and product brand names mentioned in the following text.

Instructions:
- Only extract actual brand names and company names (e.g., "屋里咖啡", "德龙", "Nespresso", "开心装监理")
- Do NOT extract generic product categories (e.g., "全自动咖啡机", "装修监理服务")
- Do NOT extract descriptive phrases or section headers
- Return ONLY a JSON array of brand names, nothing else
${predefinedBrands.length > 0 ? `- Prioritize these known brands if mentioned: ${predefinedBrands.join(', ')}` : ''}

Text:
${answer.substring(0, 4000)}

Return format: ["Brand1", "Brand2", "Brand3"]`;

        const response = await client4o.chat.completions.create({
            model: "gpt-4o-2", // This is the deployment name in Azure
            messages: [
                { role: "system", content: "You are a helpful assistant that extracts brand names from text. Always respond with valid JSON arrays only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content?.trim() || '[]';

        // Parse JSON response
        const brands = JSON.parse(content);

        if (!Array.isArray(brands)) {
            console.error('Invalid response format, expected array:', content);
            return [];
        }

        return brands.filter((b: any) => typeof b === 'string' && b.length > 0);
    } catch (error) {
        // @ts-ignore
        console.error('Error extracting brands:', error.message);
        return [];
    }
}
