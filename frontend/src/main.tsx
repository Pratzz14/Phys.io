import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./auth/AuthProvider";
import { App } from "./App";
import { Router } from "./router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Router><AuthProvider><App /></AuthProvider></Router></React.StrictMode>);
