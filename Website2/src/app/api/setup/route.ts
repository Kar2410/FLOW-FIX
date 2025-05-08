import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/flowfix";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "documents";

export async function GET() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Create vector search index
    await db.command({
      createSearchIndex: COLLECTION_NAME,
      name: "default",
      definition: {
        mappings: {
          dynamic: true,
          fields: {
            embedding: {
              type: "knnVector",
              dimensions: 1536,
              similarity: "cosine",
            },
          },
        },
      },
    });

    await client.close();

    return NextResponse.json({
      message: "MongoDB setup completed successfully",
    });
  } catch (error) {
    console.error("MongoDB setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup MongoDB" },
      { status: 500 }
    );
  }
}
