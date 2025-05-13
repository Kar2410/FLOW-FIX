import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.errorMessage;

    if (!query) {
      return NextResponse.json(
        { error: "Query or error message is required" },
        { status: 400 }
      );
    }

    // Generate public solution using Azure OpenAI
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

    const systemPrompt = `You are a highly intelligent, context-aware coding assistant.
- Only include code examples if the user's query is code-related or would benefit from a code example.
- Be concise and avoid unnecessary details.
- If the query is informational or conceptual, do NOT include code unless it adds real value.
- If possible, search the open internet for relevant, up-to-date information. If a solution is found online, include a reference link to the original source in your reply.
- If no relevant code or external source is needed, simply provide a clear, direct answer.`;

    const userPrompt = `Query: ${query}

Instructions:
1. Analyze the query and determine if a code example is truly relevant. Only include code if it directly helps answer the question.
2. If the query is about a concept, best practice, or general information, do NOT include code unless it is essential.
3. Search the open internet for any relevant, up-to-date information. If you find a solution online, include a reference link to the original source.
4. Format your response as:

# Analysis
[Brief, context-aware explanation of the query/issue]

# Solution
[Concise, actionable steps or explanation. Use bullet points if appropriate.]

# Code Example
\`\`\`[language]
[relevant code example, if needed]
\`\`\`

# Reference
[Link to the original source, if found online]

Keep the response focused and concise.`;

    const publicResponse = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    return NextResponse.json({
      solution: publicResponse.content,
    });
  } catch (error) {
    console.error("Public analysis error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
