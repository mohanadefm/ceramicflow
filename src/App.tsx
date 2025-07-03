import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ExhibitionDashboard from './pages/ExhibitionDashboard';
import WarehouseDashboard from './pages/WarehouseDashboard';
import Products from './pages/Products';
import Offers from './pages/Offers';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n/config';
import Support from './pages/Support';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DashboardRouter />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Products />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Orders />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/offers" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Offers />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/clients" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Clients />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/support" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Support />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  if (user.type === 'exhibition') {
    return <ExhibitionDashboard />;
  } else if (user.type === 'warehouse') {
    return <WarehouseDashboard />;
  }
  
  return <Navigate to="/login" replace />;
};

export default App;