import { NextResponse } from "next/server";
import { searchSimilarChunks } from "@/utils/vectorSearch";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("Analyzing query:", query);

    // Search for similar chunks
    const results = await searchSimilarChunks(query);

    if (results.length === 0) {
      console.log("No matching information found in internal knowledge base");
      return NextResponse.json({
        solution: "No relevant information found in internal knowledge base.",
        source: "internal",
      });
    }

    // Get the most relevant result
    const bestMatch = results[0];
    console.log(
      "Found matching information with similarity:",
      bestMatch.similarity
    );

    // Initialize ChatOpenAI
    const chat = new ChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiDeploymentName: "gpt-4-deployment",
      azureOpenAIApiVersion: "2024-02-15-preview",
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
        "https://",
        ""
      ).replace(".openai.azure.com/", ""),
      configuration: {
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      },
      temperature: 0.7,
    });

    // Ask LLM to analyze if the match is relevant and format the response
    const systemPrompt = `You are a versatile assistant capable of handling both technical and general queries. Your expertise includes:
1. Technical questions and code-related solutions
2. Error diagnostics and troubleshooting
3. General information and explanations
4. Best practices and implementation guidance
5. Conceptual explanations and examples

Your role is to analyze knowledge base entries and provide comprehensive responses based on the best-matching content.`;

    const userPrompt = `Query: ${query}

Best matching knowledge base entry (similarity: ${Math.round(
      bestMatch.similarity * 100
    )}%):
${bestMatch.content}

Instructions:
1. If this knowledge base entry does NOT contain relevant information, respond with ONLY: "No relevant information found in internal knowledge base."
2. If it DOES contain relevant information, provide a response in this format:

# Analysis
[Clear explanation of how this knowledge base entry relates to the query]

# Response
[Detailed response with relevant information from the knowledge base]

# Code Solution
[If the query is code-related and the knowledge base contains code, include it here with explanations]

# Additional Information
[Additional context, best practices, or related concepts from the knowledge base]

# Source
From internal knowledge base (${Math.round(
      bestMatch.similarity * 100
    )}% relevance)

Keep the response focused, accurate, and helpful. For technical queries, include practical examples and code snippets where appropriate. For general queries, provide clear and concise explanations.`;

    const response = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    const formattedSolution = response.content.toString().trim();

    // If the LLM determined there's no relevant information, return early
    if (
      formattedSolution ===
      "No relevant information found in internal knowledge base."
    ) {
      return NextResponse.json({
        solution: formattedSolution,
        source: "internal",
      });
    }

    return NextResponse.json({
      solution: formattedSolution,
      source: "internal",
      similarity: bestMatch.similarity,
    });
  } catch (error) {
    console.error("Error analyzing query:", error);
    return NextResponse.json(
      { error: "Failed to analyze query" },
      { status: 500 }
    );
  }
}
