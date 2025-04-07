import type { GetKnowledgeArgumentsType, GetKnowledgeResultType } from "./types";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Define a schema for the LLM response
const responseSchema = z.object({
  information: z.string().describe("Detailed information about the query with embedded links in markdown format"),
  links: z.array(
    z.object({
      title: z.string().describe("Title of the resource"),
      url: z.string().url().describe("URL of the resource")
    })
  ).describe("Relevant links that were embedded in the information text")
});

export const getKnowledgeFunction = async (args: GetKnowledgeArgumentsType): Promise<GetKnowledgeResultType> => {
  try {
    // Call the OpenAI API using the AI SDK with generateObject to get structured data
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: responseSchema,
      system: `You are a knowledgeable assistant that provides information about Binance Smart Chain (BSC) protocols, documentation, concepts, and tools. 
      Provide concise, accurate information with a well-structured response. Be direct and to the point.
      
      FORMAT YOUR RESPONSE AS FOLLOWS:
      - Start with a short introductory paragraph (2-3 sentences) explaining the main concept
      - Use bullet points or numbered lists for features, components, or steps
      - Break information into short, digestible sections with clear headings when appropriate
      - Avoid long paragraphs of text - keep text blocks short and focused
      - Use markdown formatting for emphasis and structure
      
      Keep your responses brief and focused on the most important information. Aim for 3-4 short sections maximum.
      Include technical details when relevant, but avoid unnecessary verbosity.
      
      IMPORTANT: Embed 3-5 relevant links directly within your response text using markdown format. For example:
      "You can trade tokens on [PancakeSwap](https://pancakeswap.finance/) which is a popular DEX on BSC."
      
      Do not list the links separately at the end of your response. Instead, naturally incorporate them into your text
      where they are most relevant to the content being discussed.
      
      Make sure all URLs are valid and point to real resources. Prefer official documentation when available.`,
      messages: [
        {
          role: "user",
          content: `Provide concise information about ${args.query} on Binance Smart Chain (BSC). 
          Format your response with short blocks of text and use bullet points or lists where appropriate.
          Focus on the most important details and key information.
          Embed relevant links directly within your response text using markdown format.`
        }
      ],
      temperature: 0.7,
    });

    // Return the LLM-generated content and links
    return {
      message: `Here's information about ${args.query} on BSC.`,
      body: {
        information: object.information,
        links: object.links
      }
    };
  } catch (error) {
    console.error("Error generating text:", error);
    // Provide a fallback with minimal hardcoded links in case of error
    return {
      message: `Error retrieving information about ${args.query} on BSC.`,
      body: {
        information: `Failed to get information about ${args.query} on BSC. Please try again later.`,
        links: [
          {
            title: "BNB Chain Documentation",
            url: "https://docs.bnbchain.org/docs/getting-started"
          }
        ]
      }
    };
  }
}; 