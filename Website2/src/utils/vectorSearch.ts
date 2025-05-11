import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "internal_knowledge_base";

// Initialize Azure OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName:
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME ||
    "embedding-model-txt-embedding-3-large",
  azureOpenAIApiVersion: "2024-10-01-preview",
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
    "https://",
    ""
  ).replace(".openai.azure.com/", ""),
  configuration: {
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  },
});

export async function processPDF(file: File) {
  try {
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    // Load and process the PDF
    const loader = new PDFLoader(
      new Blob([buffer], { type: "application/pdf" })
    );
    const docs = await loader.load();

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Generate embeddings and store in MongoDB
    const chunksWithEmbeddings = await Promise.all(
      splitDocs.map(async (doc: Document) => {
        const embedding = await embeddings.embedQuery(doc.pageContent);
        return {
          content: doc.pageContent,
          vector: embedding,
          metadata: {
            source: fileName,
            page: doc.metadata.page,
            timestamp: new Date(),
          },
        };
      })
    );

    // Insert chunks into MongoDB
    if (chunksWithEmbeddings.length > 0) {
      await collection.insertMany(chunksWithEmbeddings);
    }

    await client.close();
    return { success: true, fileName };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error: "Failed to process PDF" };
  }
}

export async function searchSimilarChunks(query: string, threshold = 0.7) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query);

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Perform vector search using MongoDB's $search aggregation
    const searchResults = await collection
      .aggregate([
        {
          $search: {
            index: "flowfix_vector_search_index",
            knnBeta: {
              vector: queryEmbedding,
              path: "vector",
              k: 5,
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

    // Filter results by threshold and format
    const relevantResults = searchResults
      .filter((result) => result.score >= threshold)
      .map((result) => ({
        content: result.content,
        similarity: result.score,
        metadata: result.metadata,
      }));

    return relevantResults;
  } catch (error) {
    console.error("Error searching chunks:", error);
    return [];
  }
}

export async function deleteDocument(fileName: string) {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Delete all chunks associated with the file
    const result = await collection.deleteMany({
      "metadata.source": fileName,
    });

    await client.close();
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}
