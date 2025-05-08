"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [publicResults, setPublicResults] = useState<string>("");
  const [internalResults, setInternalResults] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement API calls to get results from both sources
      // This is a placeholder for the actual implementation
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ errorMessage }),
      });

      const data = await response.json();
      setPublicResults(data.publicResults);
      setInternalResults(data.internalResults);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Error Analysis</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label
            htmlFor="errorMessage"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paste your error message
          </label>
          <textarea
            id="errorMessage"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Paste your error message here..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze Error"}
        </button>
      </form>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="public">Public Sources</TabsTrigger>
          <TabsTrigger value="internal">Internal Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="public">
          <div className="bg-white p-6 rounded-lg shadow">
            {publicResults ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: publicResults }}
              />
            ) : (
              <p className="text-gray-500">
                No results yet. Submit an error to see solutions from public
                sources.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="internal">
          <div className="bg-white p-6 rounded-lg shadow">
            {internalResults ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: internalResults }}
              />
            ) : (
              <p className="text-gray-500">
                No results yet. Submit an error to see solutions from internal
                knowledge base.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
