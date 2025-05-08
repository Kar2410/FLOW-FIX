import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "documents";

interface InternalResult {
  content: string;
  source: string;
  page: number;
  relevance: number;
}

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

    // Connect to MongoDB and perform vector search
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Perform vector search with a higher similarity threshold
    const searchResults = await collection
      .aggregate([
        {
          $search: {
            index: "default",
            knnBeta: {
              vector: errorEmbedding,
              path: "embedding",
              k: 3,
              filter: {
                score: { $gte: 0.8 }, // Only return results with high similarity
              },
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

    await client.close();

    if (searchResults.length === 0) {
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
      });
    }

    // Format the results
    const internalResults: InternalResult[] = searchResults.map((result) => ({
      content: result.content,
      source: result.metadata.source,
      page: result.metadata.page,
      relevance: result.score,
    }));

    return NextResponse.json({
      solution: internalResults,
    });
  } catch (error) {
    console.error("Internal analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error" },
      { status: 500 }
    );
  }
}
