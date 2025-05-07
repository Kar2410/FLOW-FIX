import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import UserInterface from "./components/UserInterface";
import AdminInterface from "./components/AdminInterface";
import Navigation from "./components/Navigation";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<UserInterface />} />
          <Route path="/admin" element={<AdminInterface />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
