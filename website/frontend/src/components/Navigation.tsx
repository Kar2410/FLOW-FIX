import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Navigation: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <img
            src="/logo.png"
            alt="UHC Logo"
            style={{ height: 36, marginRight: 12 }}
          />
          <Typography variant="h6" component="div">
            UHC FlowFix
          </Typography>
        </Box>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            User Panel
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin">
            Admin Panel
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
