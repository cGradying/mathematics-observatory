import React from "react";
import ReactDOM from "react-dom/client";
import LearnApp from "./App";
import "./index.css";

const root = document.getElementById("learn-root");

if (!root) {
  throw new Error("Learn page root element was not found.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <LearnApp />
  </React.StrictMode>,
);

