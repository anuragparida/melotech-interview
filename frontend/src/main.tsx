import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./pages/admin/index.tsx";
import Artist from "./pages/artist/index.tsx";
import AdminViewSubmissions from "./pages/admin/viewsubmissions.tsx";
import CreateSubmission from "./pages/artist/createsubmission.tsx";
import ViewSubmissionsPage from "./pages/artist/viewsubmissions.tsx";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<App />} />

        {/* Admin routes - authentication handled within components */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/adminview" element={<AdminViewSubmissions />} />

        {/* Artist routes - authentication handled within components */}
        <Route path="/artist" element={<Artist />} />
        <Route path="/submissions/create" element={<CreateSubmission />} />
        <Route path="/submissions/view" element={<ViewSubmissionsPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </StrictMode>
);
