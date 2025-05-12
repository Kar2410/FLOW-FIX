import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { MongoClient } from "mongodb";
import { cosineSimilarity } from "./mathUtils";

// MongoDB connection configuration
const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const DOCUMENTS_COLLECTION = "documents";
const KNOWLEDGE_BASE_COLLECTION = "internal_knowledge_base";

// MongoDB connection options
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

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

// Helper function to get MongoDB client
async function getMongoClient() {
  try {
    console.log("Connecting to MongoDB...");
    const client = await MongoClient.connect(MONGODB_URI, mongoOptions);
    console.log("Successfully connected to MongoDB");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error(
      "Failed to connect to MongoDB. Please check your connection settings."
    );
  }
}

export async function processPDF(file: File) {
  try {
    console.log("Starting PDF processing...");

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    console.log(`Processing file: ${fileName}`);

    // Load and process the PDF
    const loader = new PDFLoader(
      new Blob([buffer], { type: "application/pdf" })
    );
    const docs = await loader.load();
    console.log(`PDF loaded successfully. Pages: ${docs.length}`);

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Text split into ${splitDocs.length} chunks`);

    // Generate embeddings for chunks
    console.log("Generating embeddings...");
    const chunksWithEmbeddings = await Promise.all(
      splitDocs.map(async (doc: Document) => {
        const vector = await embeddings.embedQuery(doc.pageContent);
        return {
          content: doc.pageContent,
          vector,
          metadata: {
            source: fileName,
            page: doc.metadata.page,
          },
        };
      })
    );
    console.log("Embeddings generated successfully");

    return {
      success: true,
      fileName,
      chunks: chunksWithEmbeddings,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error: "Failed to process PDF" };
  }
}

export async function searchSimilarChunks(query: string, threshold = 0.7) {
  let client;
  try {
    console.log("Starting similarity search...");
    console.log("Query:", query);

    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query);
    console.log(
      "Query embedding generated with dimensions:",
      queryEmbedding.length
    );

    // Connect to MongoDB
    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Verify collection has documents
    const docCount = await collection.countDocuments();
    console.log(`Total documents in collection: ${docCount}`);

    if (docCount === 0) {
      console.log("No documents found in the collection");
      return [];
    }

    // Verify index exists
    const indexes = await collection.indexes();
    const vectorIndex = indexes.find(
      (index) => index.name === "flowfix_vector_search_index"
    );

    if (!vectorIndex) {
      console.error(
        "Vector search index not found. Please run setupVectorIndex.ts first"
      );
      throw new Error("Vector search index not found");
    }

    // Use MongoDB's vector search
    console.log(
      "Performing vector search with index: flowfix_vector_search_index"
    );

    const pipeline = [
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
    ];

    console.log(
      "Executing aggregation pipeline:",
      JSON.stringify(pipeline, null, 2)
    );

    const searchResults = await collection.aggregate(pipeline).toArray();

    console.log(`Found ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log("First result score:", searchResults[0].score);
      console.log(
        "First result content preview:",
        searchResults[0].content.substring(0, 100)
      );
    }

    // Convert search results to our expected format
    const results = searchResults
      .filter((result) => result.score >= threshold)
      .map((result) => ({
        content: result.content,
        similarity: result.score,
        metadata: result.metadata,
      }));

    console.log(`${results.length} results above threshold ${threshold}`);

    return results;
  } catch (error) {
    console.error("Error searching chunks:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error; // Re-throw to handle in the API route
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

export async function deleteDocument(fileName: string) {
  let client;
  try {
    console.log(`Deleting document: ${fileName}`);

    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Delete all chunks associated with the file
    const result = await collection.deleteMany({
      "metadata.source": fileName,
    });
    console.log(`Deleted ${result.deletedCount} chunks`);

    // Verify deletion
    const remainingDocs = await collection.countDocuments({
      "metadata.source": fileName,
    });
    console.log(
      `Remaining documents with source ${fileName}: ${remainingDocs}`
    );

    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}
