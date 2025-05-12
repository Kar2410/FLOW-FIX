import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const KNOWLEDGE_BASE_COLLECTION = "internal_knowledge_base";

async function setupVectorIndex() {
  let client;
  try {
    console.log("Connecting to MongoDB...");
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Check if index exists
    const indexes = await collection.indexes();
    const vectorIndex = indexes.find(
      (index) => index.name === "flowfix_vector_search_index"
    );

    if (!vectorIndex) {
      console.log("Creating vector search index...");
      await db.command({
        createSearchIndex: KNOWLEDGE_BASE_COLLECTION,
        name: "flowfix_vector_search_index",
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              vector: {
                type: "knnVector",
                dimensions: 1536, // OpenAI's embedding dimension
                similarity: "cosine",
              },
              content: {
                type: "string",
              },
              metadata: {
                type: "document",
              },
            },
          },
        },
      });
      console.log("Vector search index created successfully");
    } else {
      console.log("Vector search index already exists");
    }
  } catch (error) {
    console.error("Error setting up vector index:", error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the setup
setupVectorIndex().catch(console.error);
