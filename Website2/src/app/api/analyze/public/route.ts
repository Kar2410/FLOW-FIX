import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Generate solution using Azure OpenAI
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

    const systemPrompt = `You are a versatile assistant capable of handling both technical and general queries. Your expertise includes:
1. Technical questions and code-related solutions
2. Error diagnostics and troubleshooting
3. General information and explanations
4. Best practices and implementation guidance
5. Conceptual explanations and examples

Analyze the query and provide a comprehensive response in an appropriate format, prioritizing clarity and accuracy.`;

    const userPrompt = `Query: ${query}

Provide a response in this format:

# Analysis
[Clear explanation of the query and its context]

# Response
[Detailed response with relevant information]

# Code Example
[If the query is code-related, include relevant code examples with explanations]

# Additional Information
[Additional context, best practices, or related concepts]

Keep the response focused, accurate, and helpful. For technical queries, include practical examples and code snippets where appropriate. For general queries, provide clear and concise explanations.`;

    const response = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    return NextResponse.json({
      solution: response.content,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze query" },
      { status: 500 }
    );
  }
}
