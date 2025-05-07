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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/api/admin/documents"
      );
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("title", title);

    try {
      await axios.post("http://localhost:3001/api/admin/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setTitle("");
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/admin/documents/${id}`);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
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
      </Paper>
    </Container>
  );
};

export default AdminInterface;
