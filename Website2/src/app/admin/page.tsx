"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FiUpload,
  FiTrash2,
  FiFile,
  FiClock,
  FiHome,
  FiSettings,
} from "react-icons/fi";
import Link from "next/link";

interface Document {
  id: string;
  name: string;
  uploadDate: string;
  status: "processing" | "ready" | "error";
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setError(null);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const newDoc = await response.json();
        setDocuments((prev) => [...prev, newDoc]);
        setSuccess("Document uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSuccess("Document deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete document. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">
                FlowFix Admin
              </h1>
              <div className="flex space-x-4">
                <Link
                  href="/"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiHome className="w-4 h-4 mr-2" />
                  User Portal
                </Link>
                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  <FiSettings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Knowledge Base Management
          </h2>
          <p className="text-lg text-gray-600">
            Upload and manage your documentation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xl p-8 mb-8 transform transition-all duration-200 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Upload Documents
              </h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${
                    isDragActive
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
                  }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <FiUpload className="w-12 h-12 text-gray-400" />
                  {isUploading ? (
                    <p className="text-lg text-gray-600">Uploading...</p>
                  ) : isDragActive ? (
                    <p className="text-lg text-gray-600">
                      Drop the PDF files here...
                    </p>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg text-gray-600">
                        Drag and drop PDF files here, or click to select files
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Only PDF files are supported
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-8 transform transition-all duration-200 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Uploaded Documents
              </h3>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FiFile className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <FiFile className="w-6 h-6 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {doc.name}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500">
                            <FiClock className="w-4 h-4 mr-1" />
                            <span>
                              Uploaded on{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            doc.status === "ready"
                              ? "bg-green-100 text-green-800"
                              : doc.status === "processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {doc.status}
                        </span>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-8 transform transition-all duration-200 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Stats
              </h3>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {documents.length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Ready Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {documents.filter((doc) => doc.status === "ready").length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Processing</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      documents.filter((doc) => doc.status === "processing")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-200">
            {error}
          </div>
        )}

        {success && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-200">
            {success}
          </div>
        )}
      </main>
    </div>
  );
}
