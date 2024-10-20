import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App"; // Import your AppPage component
import { AdminPage } from "./AdminPage"; // Import your AdminPage component

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" Component={AdminPage} />
        <Route path="/" Component={App} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
