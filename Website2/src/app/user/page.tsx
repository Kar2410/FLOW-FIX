"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function UserInterface() {
  const [query, setQuery] = useState("");
  const [publicSolution, setPublicSolution] = useState("");
  const [internalSolution, setInternalSolution] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("public");

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setPublicSolution("");
    setInternalSolution("");

    try {
      // Analyze using public source
      const publicResponse = await fetch("/api/analyze/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        setPublicSolution(publicData.solution);
      }

      // Analyze using internal knowledge base
      const internalResponse = await fetch("/api/analyze/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (internalResponse.ok) {
        const internalData = await internalResponse.json();
        setInternalSolution(internalData.solution);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">FlowFix Query Assistant</h1>
      <div className="mb-4">
        <textarea
          placeholder="Enter your question, error message, or query here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-32 p-2 border rounded-md"
        />
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !query.trim()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
        >
          {isAnalyzing ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Get Answer"
          )}
        </button>
      </div>

      <div className="border rounded-lg">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("public")}
            className={`px-4 py-2 ${
              activeTab === "public" ? "bg-gray-100" : ""
            }`}
          >
            Public Source
          </button>
          <button
            onClick={() => setActiveTab("internal")}
            className={`px-4 py-2 ${
              activeTab === "internal" ? "bg-gray-100" : ""
            }`}
          >
            Internal Knowledge Base
          </button>
        </div>

        <div className="p-4">
          {isAnalyzing ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activeTab === "public" ? (
            publicSolution ? (
              <div className="prose max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: publicSolution.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            ) : (
              <p className="text-gray-500">
                Enter a question, error message, or query and click Get Answer
                to get a solution.
              </p>
            )
          ) : internalSolution ? (
            Array.isArray(internalSolution) ? (
              <div className="space-y-4">
                {internalSolution.map((result, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="prose max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: result.content.replace(/\n/g, "<br />"),
                        }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Source: {result.source} (Page {result.page})
                      <br />
                      Relevance: {Math.round(result.relevance * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{internalSolution}</p>
            )
          ) : (
            <p className="text-gray-500">
              Enter a question, error message, or query and click Get Answer to
              search the internal knowledge base.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
