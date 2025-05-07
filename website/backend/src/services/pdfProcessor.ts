import pdfParse from "pdf-parse";
import { OpenAIEmbeddings } from "@langchain/openai";
import fs from "fs";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  azureOpenAIApiVersion: "2024-02-15-preview",
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
});

export async function processPDF(filePath: string) {
  try {
    // Read PDF file
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Extract text content
    const content = pdfData.text;

    // Generate embeddings
    const embedding = await embeddings.embedQuery(content);

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    return {
      content,
      embeddings: embedding,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error processing PDF: ${error.message}`);
    }
    throw new Error("Error processing PDF: Unknown error occurred");
  }
}
