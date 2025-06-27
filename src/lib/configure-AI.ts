import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Define the schema for search request using Zod
const searchRequestSchema = z.object({
    search: z.string().describe("Location or property name to search for"),
    maxItems: z.number().default(5).describe("Maximum number of results to return"),
    propertyType: z.string().default("Apartments").describe("Type of property to filter by"),
    sortBy: z.string().default("distance_from_search").describe("How to sort the results"),
    starsCountFilter: z.string().optional().describe("Filter by star rating"),
    currency: z.string().default("USD").describe("Currency for prices"),
    language: z.string().default("en-gb").describe("Language for results"),
    rooms: z.number().optional().describe("Number of rooms needed"),
    adults: z.number().optional().describe("Number of adults"),
    children: z.number().optional().describe("Number of children"),
    minMaxPrice: z.string().default("0-999999").describe("Price range in format min-max")
});

type SearchRequest = z.infer<typeof searchRequestSchema>;

const prompt = PromptTemplate.fromTemplate(`You are an AI assistant that helps users search for accommodations.
Your task is to extract search parameters from the user's query and format them into a structured search request.

Here is the user's query:
{query}

Extract the search parameters and provide a JSON object with the following fields:
- search: Location or property name to search for (required)
- starsCountFilter: Star rating filter (only include if mentioned in query)
- rooms: Number of rooms (only include if mentioned in query)
- adults: Number of adults (only include if mentioned in query)
- children: Number of children (only include if mentioned in query)
- budget: Budget amount in dollars (only include if mentioned in query)

Important rules:
- Only include fields that are explicitly mentioned in the user's query
- Do not include default values in the response
- If no location is specified, use "Miami beach" as the search location
- For budget, extract only the numeric value (e.g., if user says "30 dollars" or "$30", extract 30)
- Respond ONLY with a valid JSON object, no markdown formatting, no code blocks, no additional text

Example:
Query: "I need accommodation in Paris for 3 adults"
Response: {{"search": "Paris", "adults": 3}}

Query: "Find me a 4-star hotel in London for 2 rooms with a budget of 50 dollars"
Response: {{"search": "London", "starsCountFilter": "4", "rooms": 2, "budget": 50}}`);

/**
 * Processes a natural language query into a structured search request
 * @param query The user's natural language query
 * @returns A validated search request object
 */
export async function processSearchQuery(query: string): Promise<SearchRequest> {
    // Initialize the AI model
    const model = new ChatOpenAI({
        temperature: 0,
        modelName: "gpt-4o",
    });

    try {
        // Generate the prompt
        const promptValue = await prompt.format({ query });

        // Get the AI's response
        const response = await model.invoke(promptValue);

        // Parse the response as JSON
        let extractedParams: any = {};
        try {
            let content: string;
            if (typeof response.content === "string") {
                content = response.content;
            } else if (Array.isArray(response.content)) {
                content = response.content.map((c: any) => (typeof c === "string" ? c : c.text ?? "")).join("");
            } else {
                content = "";
            }

            // Remove markdown code blocks if present
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            extractedParams = JSON.parse(content);
        } catch (e: any) {
            console.error("Failed to parse AI response as JSON:", response);
            throw new Error(`JSON parsing error: ${e.message}`);
        }

        // Start with required defaults
        const searchRequest: any = {
            currency: "USD",
            language: "en-gb",
            maxItems: 5,
            minMaxPrice: "0-999999",
            propertyType: "Apartments",
            sortBy: "distance_from_search",
            search: extractedParams.search || "Miami beach"
        };

        // Add optional fields only if they were extracted from the query
        if (extractedParams.starsCountFilter) {
            searchRequest.starsCountFilter = extractedParams.starsCountFilter;
        }
        if (extractedParams.rooms) {
            searchRequest.rooms = extractedParams.rooms;
        }
        if (extractedParams.adults) {
            searchRequest.adults = extractedParams.adults;
        }
        if (extractedParams.children) {
            searchRequest.children = extractedParams.children;
        }

        // Handle budget - update minMaxPrice if budget is provided
        if (extractedParams.budget) {
            searchRequest.minMaxPrice = `0-${extractedParams.budget}`;
        }

        // Validate the final result
        const validatedResult = searchRequestSchema.parse(searchRequest);

        return validatedResult;
    } catch (error) {
        console.error("Error processing search query:", error);
        // Return minimal default values if parsing fails
        return searchRequestSchema.parse({
            search: "Miami beach",
            currency: "USD",
            language: "en-gb",
            maxItems: 5,
            minMaxPrice: "0-999999",
            propertyType: "Apartments",
            sortBy: "distance_from_search"
        });
    }
}
