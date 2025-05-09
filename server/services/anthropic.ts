import Anthropic from '@anthropic-ai/sdk';
import { log, error } from '../log';

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ExtractedAmount {
  accountName: string;
  amount: number;
  confidence: number;
}

/**
 * Analyzes a screenshot image to extract financial account information
 * @param base64Image - Base64 encoded image data
 * @param providerNames - Array of provider names to look for in the image
 * @returns An array of extracted account values
 */
export async function extractAccountValuesFromImage(
  base64Image: string, 
  providerNames: string[]
): Promise<ExtractedAmount[]> {
  try {
    const providersString = providerNames.join(", ");
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      system: `You are a financial assistant that extracts account balances from screenshots of financial accounts.
      
Your task is to identify account balances for the following providers: ${providersString}.
For each account you identify:
1. Extract the provider name (must match one from the list)
2. Extract the account balance (in pounds)
3. Assess your confidence in the extraction (as a number 0-1)

Format your response as JSON only, with this structure:
[
  {
    "accountName": "Provider Name",
    "amount": 12345.67,
    "confidence": 0.95
  }
]

ONLY include accounts where you can actually read a balance value from the image.
NEVER make up or guess account values if they aren't clearly shown.
If you can't identify any account details, return an empty array.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image
              }
            },
            {
              type: "text",
              text: "Extract the account balances from this financial screenshot."
            }
          ]
        }
      ],
    });

    try {
      const jsonContent = response.content[0].text;
      // Parse the JSON response
      const extractedData: ExtractedAmount[] = JSON.parse(jsonContent);
      
      // Validate that the response is an array
      if (!Array.isArray(extractedData)) {
        log('Invalid response format from Anthropic API: not an array');
        return [];
      }
      
      // Validate each item in the array has the expected structure
      const validatedData = extractedData.filter(item => 
        typeof item.accountName === 'string' &&
        typeof item.amount === 'number' &&
        typeof item.confidence === 'number' &&
        item.confidence >= 0 &&
        item.confidence <= 1
      );
      
      return validatedData;
    } catch (parseError) {
      error(`Error parsing Anthropic API response: ${parseError}`);
      return [];
    }
  } catch (apiError) {
    error(`Error calling Anthropic API: ${apiError}`);
    return [];
  }
}