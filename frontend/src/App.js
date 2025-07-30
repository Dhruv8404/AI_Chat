import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AiChat from "./pages/AiChat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<AiChat />} />
      </Routes>
    </Router>
  );
}

export default App; // ✅ Don't forget this line
