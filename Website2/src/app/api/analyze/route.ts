import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/flowfix";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "documents";

export async function POST(request: Request) {
  try {
    const { errorMessage } = await request.json();

    if (!errorMessage) {
      return NextResponse.json(
        { error: "Error message is required" },
        { status: 400 }
      );
    }

    // Create embeddings for the error message using Azure OpenAI
    const embeddings = new OpenAIEmbeddings({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiDeploymentName: "text-embedding-ada-002",
      azureOpenAIApiVersion: "2024-02-15-preview",
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
        "https://",
        ""
      ).replace(".openai.azure.com/", ""),
      configuration: {
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      },
    });
    const errorEmbedding = await embeddings.embedQuery(errorMessage);

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Perform vector search
    const searchResults = await collection
      .aggregate([
        {
          $search: {
            index: "default",
            knnBeta: {
              vector: errorEmbedding,
              path: "embedding",
              k: 3,
            },
          },
        },
        {
          $project: {
            content: 1,
            metadata: 1,
            score: { $meta: "searchScore" },
          },
        },
      ])
      .toArray();

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

    const publicResponse = await chat.invoke([
      [
        "system",
        "You are a helpful assistant that provides solutions to technical errors.",
      ],
      ["user", `Please provide a solution for this error: ${errorMessage}`],
    ]);

    // Format internal results
    const internalResults = searchResults.map((result) => ({
      content: result.content,
      source: result.metadata.source,
      page: result.metadata.page,
      relevance: result.score,
    }));

    await client.close();

    return NextResponse.json({
      publicSolution: publicResponse.content,
      internalResults,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error" },
      { status: 500 }
    );
  }
}
