import { NextResponse } from "next/server";
import { searchSimilarChunks } from "@/utils/vectorSearch";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.errorMessage;

    if (!query) {
      return NextResponse.json(
        { error: "No query or error message provided" },
        { status: 400 }
      );
    }

    console.log("Processing query:", query);

    // Search for similar chunks
    const results = await searchSimilarChunks(query);

    // If no matches found in knowledge base, return early
    if (results.length === 0) {
      return NextResponse.json({
        solution:
          "No matching information found in the internal knowledge base.",
        source: "internal",
      });
    }

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

    const systemPrompt = `You are a knowledge base assistant. Your task is to ONLY use the provided knowledge base content to answer queries. 
DO NOT generate generic responses or code examples that are not explicitly present in the knowledge base content.
If the knowledge base content doesn't contain a direct/close or relevant answer, acknowledge that and do not make up information.`;

    // Get all relevant results above a lower threshold
    const relevantResults = results.filter((result) => result.similarity > 0.3);

    if (relevantResults.length === 0) {
      return NextResponse.json({
        solution:
          "No sufficiently relevant information found in the internal knowledge base.",
        source: "internal",
      });
    }

    // Combine all relevant chunks for better context
    const combinedContent = relevantResults
      .map((result) => result.content)
      .join("\n\n");

    const userPrompt = `Query: ${query}

Knowledge base content:
${combinedContent}

Instructions:
1. ONLY use the provided knowledge base content to answer the query.
2. DO NOT add any information that is not present in the knowledge base content.
3. If the knowledge base content doesn't directly answer the query, say so.
4. Format your response as:

# Analysis
[Brief explanation based ONLY on the knowledge base content]

# Solution
[Steps or information ONLY from the knowledge base content]

# Code Example (ONLY if code is explicitly present in the knowledge base content)
\`\`\`[language]
[exact code from knowledge base]
\`\`\`

# Source
From internal knowledge base (${Math.round(
      relevantResults[0].similarity * 100
    )}% relevance)`;

    const response = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    const formattedSolution = response.content.toString().trim();

    return NextResponse.json({
      solution: formattedSolution,
      source: "internal",
      similarity: relevantResults[0].similarity,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
