import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import axios from "axios";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserInterface: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [analysis, setAnalysis] = useState<{
    analysis: string;
    internalSources: Array<{ title: string; fileName: string }>;
  } | null>(null);

  const handleSubmit = async () => {
    if (!errorMessage.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/api/error/analyze",
        {
          errorMessage,
        }
      );
      setAnalysis(response.data);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          FlowFix
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Paste your error message here"
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : "Analyze Error"}
        </Button>

        {analysis && (
          <Box sx={{ width: "100%" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Public Sources" />
              <Tab label="Internal Knowledge Base" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <SyntaxHighlighter language="markdown" style={docco}>
                {analysis.analysis}
              </SyntaxHighlighter>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {analysis.internalSources.length > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Relevant Internal Documents:
                  </Typography>
                  {analysis.internalSources.map((source, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1">
                        {source.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        File: {source.fileName}
                      </Typography>
                    </Paper>
                  ))}
                </>
              ) : (
                <Typography>No relevant internal documents found.</Typography>
              )}
            </TabPanel>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UserInterface;
