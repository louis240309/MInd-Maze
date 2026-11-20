import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewMysteryPage } from "./pages/NewMysteryPage";
import { InvestigationPage } from "./pages/InvestigationPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Landing */}
              <Route path="/" element={<LandingPage />} />

              {/* Guest Only Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* Protected Detective Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-mystery"
                element={
                  <ProtectedRoute>
                    <NewMysteryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/:id"
                element={
                  <ProtectedRoute>
                    <InvestigationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
