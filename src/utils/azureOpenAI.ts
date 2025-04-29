import * as vscode from "vscode";
import { AzureChatOpenAI } from "@langchain/azure-openai";
import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";

export class AzureOpenAIService {
  private llm: AzureChatOpenAI;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Azure OpenAI configuration
    const AZURE_OPENAI_API_KEY = "xxxxxxxxxxxxxxxxxxx0f";
    const AZURE_OPENAI_ENDPOINT = "h/";
    const AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4-deployment";

    this.llm = new AzureChatOpenAI({
      openAIApiKey: AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: AZURE_OPENAI_ENDPOINT,
      azureOpenAIApiDeploymentName: AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: "2024-10-01-preview",
    });
  }

  async analyzeError(
    errorMessage: string,
    knowledgeBaseContent?: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a coding assistant. Analyze this error and provide a concise solution.`;

      let userPrompt = `Error: ${errorMessage}

Provide a response in this format:

# Error Analysis
[One line explanation of the error]

# Solution
[2-3 bullet points with clear steps]

# Code Fix
\`\`\`[language]
[only the relevant code fix]
\`\`\`

Keep the response focused and concise.`;

      if (knowledgeBaseContent) {
        userPrompt += `\n\nInternal Knowledge Base Context:\n${knowledgeBaseContent}\n\nIncorporate this information if relevant.`;
      }

      const messages: BaseMessage[] = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await this.llm.call(messages);
      return response.content.toString() || "No response from Azure OpenAI";
    } catch (error: any) {
      console.error("Azure OpenAI API error:", error);
      return `Error analyzing the error message: ${error.message}`;
    }
  }
}
