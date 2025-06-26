import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MigrationProvider } from './context/MigrationContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { AccountProvider } from './context/AccountContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MigrationJourney from './pages/Migrationjourney';
import PhaseDetail from './pages/PhaseDetail';
import StepDetail from './pages/StepDetail';
import Login from './pages/Login';
import AIAgent from './pages/AIAgent';
import APIDetails from './pages/APIDetails';
import TerraformDetails from './pages/TerraformDetails';
import MigrationPhase from './pages/MigrationPhase';
import AttachDetachStep from './pages/AttachDetachStep';
import FloatingChatButton from './components/layout/FloatingChatButton';
import AccountRequiredGuard from './components/guards/AccountRequiredGuard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Handle login
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Authenticated layout with sidebar and header
  const AuthenticatedLayout = ({ children }: { 
    children: React.ReactNode
  }) => {
    return (
      <div className="min-h-screen bg-theme-primary">
        <Header />
        <Sidebar />
        <main className="pt-16 pl-64">
          {children}
        </main>
        <FloatingChatButton />
      </div>
    );
  };

  return (
    <Router>
      <ThemeProvider>
        <MigrationProvider>
          <SidebarProvider>
            <AccountProvider>
            <Routes>
            <Route 
              path="/login" 
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />
            
            {/* AWS Auth route removed - now handled as a modal in Dashboard */}
            
            <Route 
              path="/dashboard" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <Dashboard />
                  </AuthenticatedLayout>
                )
              } 
            />
            
            <Route 
              path="/migration-journey" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <AccountRequiredGuard>
                      <MigrationJourney />
                    </AccountRequiredGuard>
                  </AuthenticatedLayout>
                )
              } 
            />
            
            <Route 
              path="/ai-agent" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <AIAgent />
                  </AuthenticatedLayout>
                )
              }
            />
            
            <Route 
              path="/api-details" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <APIDetails />
                  </AuthenticatedLayout>
                )
              }
            />
            
            <Route 
              path="/terraform-details" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <TerraformDetails />
                  </AuthenticatedLayout>
                )
              }
            />
            
            <Route 
              path="/phase" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <AccountRequiredGuard>
                      <MigrationPhase />
                    </AccountRequiredGuard>
                  </AuthenticatedLayout>
                )
              }
            />
            
            <Route 
              path="/phase/:phaseType" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <AccountRequiredGuard>
                      <PhaseDetail />
                    </AccountRequiredGuard>
                  </AuthenticatedLayout>
                )
              } 
            />
            
            <Route 
              path="/phase/:phaseType/:stepSlug" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <AccountRequiredGuard>
                      <StepDetail />
                    </AccountRequiredGuard>
                  </AuthenticatedLayout>
                )
              } 
            />
            
            <Route 
              path="/aws-attach-detach" 
              element={
                !isLoggedIn ? (
                  <Navigate to="/login" />
                ) : (
                  <AuthenticatedLayout>
                    <AccountRequiredGuard>
                      <AttachDetachStep />
                    </AccountRequiredGuard>
                  </AuthenticatedLayout>
                )
              } 
            />
            
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
            </AccountProvider>
          </SidebarProvider>
        </MigrationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;