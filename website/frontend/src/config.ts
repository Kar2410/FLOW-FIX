// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

// API Endpoints
export const API_ENDPOINTS = {
  ERROR_ANALYSIS: `${API_BASE_URL}/api/error/analyze`,
  DOCUMENTS: `${API_BASE_URL}/api/admin/documents`,
  UPLOAD: `${API_BASE_URL}/api/admin/upload`,
  HEALTH: `${API_BASE_URL}/health`,
};

// Application Configuration
export const APP_CONFIG = {
  APP_NAME: "FlowFix",
  VERSION: "1.0.0",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: [".pdf"],
};

// Error Messages
export const ERROR_MESSAGES = {
  CONNECTION_ERROR:
    "Unable to connect to the server. Please check your network connection.",
  UPLOAD_ERROR: "Failed to upload document. Please try again.",
  ANALYSIS_ERROR: "Error analyzing the input. Please try again.",
  INVALID_FILE: "Invalid file type. Please upload a PDF file.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit of 10MB.",
};
