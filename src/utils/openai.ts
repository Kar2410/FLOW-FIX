import * as vscode from "vscode";
import { OpenAI as OpenAIClient } from "openai";

export class OpenAIService {
  private client: OpenAIClient;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Your OpenAI API key
    const apiKey = "";

    if (!apiKey) {
      vscode.window.showErrorMessage("OpenAI API key is not configured.");
      throw new Error("OpenAI API key not configured");
    }

    this.client = new OpenAIClient({
      apiKey: apiKey,
    });
  }

  async analyzeError(errorMessage: string): Promise<string> {
    try {
      const temperature = 0.7; // You can modify this value directly here

      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        temperature: temperature,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful coding assistant. Explain errors in beginner-friendly language and provide practical solutions.",
          },
          {
            role: "user",
            content: `Please analyze this error and provide a solution: ${errorMessage}`,
          },
        ],
      });

      return response.choices[0].message.content || "No response from OpenAI";
    } catch (error) {
      vscode.window.showErrorMessage(`OpenAI API error: ${error}`);
      return "Error analyzing the error message. Please check your API key and try again.";
    }
  }
}
