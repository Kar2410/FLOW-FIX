import { NextResponse } from "next/server";
import { searchSimilarChunks } from "@/utils/vectorSearch";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const { errorMessage } = await request.json();

    if (!errorMessage) {
      return NextResponse.json(
        { error: "No error message provided" },
        { status: 400 }
      );
    }

    console.log("Analyzing error message:", errorMessage);

    // Search for similar chunks
    const results = await searchSimilarChunks(errorMessage);

    if (results.length === 0) {
      console.log("No matching solutions found in internal knowledge base");
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
        source: "internal",
      });
    }

    // Get the most relevant result
    const bestMatch = results[0];
    console.log(
      "Found matching solution with similarity:",
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
    const systemPrompt = `You are a coding assistant analyzing if a knowledge base entry contains a solution for a specific error.`;
    const userPrompt = `Error to analyze: ${errorMessage}

Knowledge base entry (similarity: ${Math.round(bestMatch.similarity * 100)}%):
${bestMatch.content}

Instructions:
1. First, determine if this knowledge base entry contains a revelent/close solution for the specific error above.
2. If it does NOT contain a revelent/close solution, respond with ONLY: "No solution found in internal knowledge base."
3. If it DOES contain a revelent/close solution, format your response as:

# Error Analysis
[One line explanation of the error]

# Solution
[2-3 bullet points with clear steps]

# Code Fix
\`\`\`[language]
[only the relevant code fix]
\`\`\`

# Source
From internal knowledge base (${Math.round(
      bestMatch.similarity * 100
    )}% relevance)

Keep the response focused and concise. Only include information that directly addresses the error.`;

    const response = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    const formattedSolution = response.content.toString().trim();

    // If the LLM determined there's no solution, return early
    if (formattedSolution === "No solution found in internal knowledge base.") {
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
    console.error("Error analyzing error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error message" },
      { status: 500 }
    );
  }
}
