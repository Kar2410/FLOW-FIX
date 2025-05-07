import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { API_ENDPOINTS, ERROR_MESSAGES } from "../config";

interface Document {
  _id: string;
  title: string;
  fileName: string;
  uploadDate: string;
  fileSize: number;
}

const AdminInterface: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.DOCUMENTS);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files[0]) {
      if (files[0].size > 10 * 1024 * 1024) {
        setError(ERROR_MESSAGES.FILE_TOO_LARGE);
        return;
      }
      if (!files[0].name.toLowerCase().endsWith(".pdf")) {
        setError(ERROR_MESSAGES.INVALID_FILE);
        return;
      }
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("title", title);

    try {
      await axios.post(API_ENDPOINTS.UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess("Document uploaded successfully!");
      setTitle("");
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      setError(ERROR_MESSAGES.UPLOAD_ERROR);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
      setSuccess("Document deleted successfully!");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Document Management
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button variant="contained" component="label" sx={{ mr: 2 }}>
            Select PDF
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={handleFileSelect}
            />
          </Button>

          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {selectedFile.name}
            </Typography>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || uploading}
            sx={{ mt: 2 }}
          >
            {uploading ? <CircularProgress size={24} /> : "Upload Document"}
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>
          Uploaded Documents
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {documents.map((doc) => (
              <ListItem key={doc._id}>
                <ListItemText
                  primary={doc.title}
                  secondary={`File: ${doc.fileName} | Size: ${(
                    doc.fileSize / 1024
                  ).toFixed(2)} KB | Uploaded: ${new Date(
                    doc.uploadDate
                  ).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(doc._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminInterface;
