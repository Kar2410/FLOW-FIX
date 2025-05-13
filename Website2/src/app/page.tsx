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
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function Home() {
  const [errorMessage, setErrorMessage] = useState("");
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
        body: JSON.stringify({ errorMessage }),
      });
      const publicData = await publicRes.json();
      setPublicAnalysis(publicData.solution || "No solution found.");

      // Always fetch internal solution
      const internalRes = await fetch("/api/analyze/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorMessage }),
      });
      const internalData = await internalRes.json();
      if (
        internalData?.solution &&
        !internalData?.solution.toLowerCase().includes("no matching solutions")
      ) {
        setInternalAnalysis(internalData.solution);
      } else {
        setInternalAnalysis(
          "No information found for this error in the internal knowledge base."
        );
      }
    } catch (err) {
      setError("Failed to analyze error. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Image
                src="/uhc-logo.png"
                alt="UHC Logo"
                width={36}
                height={36}
              />
              <h1 className="text-2xl font-bold text-gray-900">UHC FlowFix</h1>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <FiExternalLink className="w-4 h-4 mr-2" />
              Admin Portal
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Centralized Solutioning Portal
          </h2>
          <p className="text-lg text-gray-600">
            Your gateway to fast & intelligent solutions.
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze();
            }}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="errorMessage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Error Message
              </label>
              <div className="relative">
                <textarea
                  id="errorMessage"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Paste your error message here..."
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !errorMessage.trim()}
              className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200
                ${
                  isAnalyzing || !errorMessage.trim()
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.02]"
                }`}
            >
              {isAnalyzing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <FiSearch className="w-5 h-5 mr-2" />
                  Let’s Dive In!
                </>
              )}
            </button>
          </form>
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
                  <MarkdownRenderer>{publicAnalysis || ""}</MarkdownRenderer>
                </div>
              ) : null
            ) : (
              internalAnalysis && (
                <div className="prose max-w-none">
                  <MarkdownRenderer>{internalAnalysis || ""}</MarkdownRenderer>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
