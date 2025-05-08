"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to FlowFix
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered error analysis and solution tool
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/user" className="block">
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                User Interface
              </h2>
              <p className="text-gray-600">
                Analyze errors and get solutions from both public sources and
                internal knowledge base.
              </p>
            </div>
          </Link>

          <Link href="/admin" className="block">
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                Admin Interface
              </h2>
              <p className="text-gray-600">
                Manage internal knowledge base and upload documentation.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
