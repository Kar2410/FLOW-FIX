import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { MongoClient } from "mongodb";
import { cosineSimilarity } from "./mathUtils";

const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "internal_knowledge_base";

const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: "2024-02-15-preview",
  azureOpenAIApiInstanceName: "kgnwl0lm6yi5ugbopenai",
  azureOpenAIApiDeploymentName:
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
  configuration: {
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  },
});

async function getMongoClient() {
  return await MongoClient.connect(MONGODB_URI);
}

export async function processPDF(file: File) {
  try {
    console.log("Processing PDF:", file.name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const loader = new PDFLoader(
      new Blob([buffer], { type: "application/pdf" })
    );
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} pages from PDF`);

    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    for (const doc of docs) {
      const embedding = await embeddings.embedQuery(doc.pageContent);

      await collection.insertOne({
        content: doc.pageContent,
        vector: embedding,
        metadata: {
          source: file.name,
          page: doc.metadata.page,
        },
      });
    }

    await client.close();
    console.log("Successfully processed and stored PDF chunks");

    return {
      success: true,
      fileName: file.name,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return {
      success: false,
      error: "Failed to process PDF",
    };
  }
}

export async function searchSimilarChunks(query: string) {
  try {
    console.log("Searching for similar chunks to query:", query);
    const queryEmbedding = await embeddings.embedQuery(query);

    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const chunks = await collection.find({}).toArray();
    await client.close();

    if (chunks.length === 0) {
      console.log("No chunks found in database");
      return [];
    }

    const similarChunks = chunks
      .map((chunk) => ({
        content: chunk.content,
        similarity: cosineSimilarity(queryEmbedding, chunk.vector),
        metadata: chunk.metadata,
      }))
      .filter((chunk) => chunk.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity);

    console.log(`Found ${similarChunks.length} similar chunks`);
    return similarChunks;
  } catch (error) {
    console.error("Error searching similar chunks:", error);
    return [];
  }
}

export async function deleteDocument(id: string) {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    await collection.deleteMany({ "metadata.source": id });
    await client.close();

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}
