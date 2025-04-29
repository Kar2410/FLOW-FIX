import * as vscode from "vscode";
import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

export class AzureOpenAIService {
  private llm: ChatOpenAI;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Azure OpenAI configuration
    const AZURE_OPENAI_API_KEY = "";
    const AZURE_OPENAI_ENDPOINT = "";
    const AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4-deployment";

    this.llm = new ChatOpenAI({
      openAIApiKey: AZURE_OPENAI_API_KEY,
      azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
      azureOpenAIApiDeploymentName: AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: "2024-02-15-preview",
      azureOpenAIApiInstanceName: AZURE_OPENAI_ENDPOINT.replace(
        "https://",
        ""
      ).replace(".openai.azure.com/", ""),
      configuration: {
        baseURL: AZURE_OPENAI_ENDPOINT,
      },
      streaming: true,
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
