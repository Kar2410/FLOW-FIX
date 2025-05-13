"use client";

import { useState } from "react";
import {
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiUpload,
  FiExternalLink,
} from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [publicAnalysis, setPublicAnalysis] = useState<string | null>(null);
  const [internalAnalysis, setInternalAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setPublicAnalysis(null);
    setInternalAnalysis(null);
    try {
      // Always fetch public solution
      const publicRes = await fetch("/api/analyze/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const publicData = await publicRes.json();
      setPublicAnalysis(publicData.solution || "No information found.");

      // Always fetch internal solution
      const internalRes = await fetch("/api/analyze/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const internalData = await internalRes.json();
      if (
        internalData?.solution &&
        !internalData?.solution
          .toLowerCase()
          .includes("no relevant information")
      ) {
        setInternalAnalysis(internalData.solution);
      } else {
        setInternalAnalysis(
          "No information found for this query in the internal knowledge base."
        );
      }
    } catch (err) {
      setError("Failed to analyze query. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-indigo-600">
                  FlowFix
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiUpload className="mr-2" />
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Knowledge Base Portal
          </h2>
          <p className="text-lg text-gray-600">
            Get instant answers to your questions from our knowledge base
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-8 transform transition-all duration-200 hover:shadow-2xl">
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setActiveTab("public")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "public"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Public Source
            </button>
            <button
              onClick={() => setActiveTab("internal")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "internal"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Internal Knowledge Base
            </button>
          </div>

          <div className="mb-6">
            <div className="flex rounded-lg shadow-sm">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your question or query..."
                className="flex-1 min-w-0 block w-full px-4 py-3 rounded-l-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !query.trim()}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-r-lg text-white ${
                  isAnalyzing || !query.trim()
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <FiSearch className="animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiSearch className="mr-2" />
                    Get Answer
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-lg transform transition-all duration-200 hover:shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabbed Results */}
          <div className="bg-white rounded-xl shadow-xl p-8 transform transition-all duration-200 hover:shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {activeTab === "public"
                ? "Public Source Result"
                : "Internal Knowledge Base Result"}
            </h2>
            <div className="space-y-6">
              {isAnalyzing ? (
                <div className="text-center text-indigo-600 font-semibold">
                  Analyzing...
                </div>
              ) : activeTab === "public" ? (
                publicAnalysis ? (
                  <div className="prose max-w-none">
                    <ReactMarkdown children={publicAnalysis || ""} />
                  </div>
                ) : null
              ) : (
                internalAnalysis && (
                  <div className="prose max-w-none">
                    <ReactMarkdown children={internalAnalysis || ""} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
