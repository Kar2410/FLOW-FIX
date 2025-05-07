import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

export class AzureOpenAIService {
  private llm: ChatOpenAI;

  constructor() {
    const requiredEnvVars = {
      AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      AZURE_OPENAI_INSTANCE_NAME: process.env.AZURE_OPENAI_INSTANCE_NAME,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file.`
      );
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: "2024-02-15-preview",
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
      streaming: true,
    });
  }

  async analyzeError(
    errorMessage: string,
    knowledgeBaseContent?: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a coding assistant. Analyze this error and provide a concise solution.`;
      let userPrompt = `Error: ${errorMessage}\n\nProvide a response in this format:\n\n# Error Analysis\n[One line explanation of the error]\n\n# Solution\n[2-3 bullet points with clear steps]\n\n# Code Fix\n\`\`\`[language]\n[only the relevant code fix]\n\`\`\`\n\nKeep the response focused and concise.`;

      if (knowledgeBaseContent) {
        userPrompt += `\n\nInternal Knowledge Base Context:\n${knowledgeBaseContent}\n\nIncorporate this information if relevant.`;
      }

      const messages: BaseMessage[] = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      let fullResponse = "";
      const response = await this.llm.stream(messages);

      for await (const chunk of response) {
        if (chunk.content) {
          fullResponse += chunk.content;
        }
      }

      return fullResponse || "No response from Azure OpenAI";
    } catch (error: any) {
      console.error("Azure OpenAI API error:", error);
      return `Error analyzing the error message: ${error.message}`;
    }
  }
}
