import OpenAI from "openai";
import { Account, Milestone } from "@shared/schema";

/**
 * Generate intelligent milestone suggestions using xAI's Grok API
 */
export async function generateMilestoneSuggestions(
  accounts: Account[],
  totalValue: number,
  existingMilestones: Milestone[]
): Promise<any[]> {
  try {
    if (!process.env.XAI_API_KEY) {
      throw new Error("XAI_API_KEY environment variable is required");
    }

    const openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });

    // Build a detailed prompt based on portfolio data
    const prompt = buildMilestonePrompt(accounts, totalValue, existingMilestones);

    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor specialized in helping people set and track investment goals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and validate the response
    const result = JSON.parse(response.choices[0].message.content);
    
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      console.error("Invalid response format from Grok API:", result);
      return [];
    }

    return result.suggestions;
  } catch (error) {
    console.error("Error generating milestone suggestions with Grok:", error);
    throw error;
  }
}

/**
 * Build a detailed prompt for the AI based on portfolio data
 */
function buildMilestonePrompt(
  accounts: Account[],
  totalValue: number,
  existingMilestones: Milestone[]
): string {
  // Format account data
  const accountsText = accounts.map(account => (
    `- ${account.provider} ${account.accountType} account: £${account.currentValue}`
  )).join('\n');

  // Format existing milestones to avoid duplication
  const milestonesText = existingMilestones.map(milestone => (
    `- ${milestone.name}: £${milestone.targetValue}${milestone.accountType ? ` (${milestone.accountType})` : ''}`
  )).join('\n');

  // Build the prompt
  return `
I need personalized investment milestone suggestions for my portfolio.

Current Portfolio:
${accountsText}
Total portfolio value: £${totalValue}

Existing Milestones (don't suggest duplicates):
${milestonesText || "None"}

Please suggest 3-5 realistic and achievable milestone goals for my investments. 
For each suggestion, provide:
1. A concise milestone name
2. The account type it applies to (ISA, SIPP, LISA, GIA, or null for the entire portfolio)
3. A target value that is ambitious but attainable based on my current portfolio
4. A short description explaining the benefit or significance of reaching this milestone
5. An optional emoji icon that represents the milestone

Return the response in JSON format with this structure:
{
  "suggestions": [
    {
      "name": "string",
      "accountType": "string or null",
      "targetValue": "string (numeric value without currency symbol)",
      "description": "string",
      "icon": "string (emoji)"
    }
  ]
}
`;
}