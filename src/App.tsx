import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
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

// مكون وسيط لإجبار إعادة بناء Layout عند تغيير اللغة
const LanguageKeyWrapper = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();
  return <Layout key={language}>{children}</Layout>;
};

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
                      <LanguageKeyWrapper>
                        <DashboardRouter />
                      </LanguageKeyWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute>
                      <LanguageKeyWrapper>
                        <Products />
                      </LanguageKeyWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <LanguageKeyWrapper>
                        <Orders />
                      </LanguageKeyWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/offers" 
                  element={
                    <ProtectedRoute>
                      <LanguageKeyWrapper>
                        <Offers />
                      </LanguageKeyWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/clients" 
                  element={
                    <ProtectedRoute>
                      <LanguageKeyWrapper>
                        <Clients />
                      </LanguageKeyWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/support" 
                  element={
                    <ProtectedRoute>
                      <LanguageKeyWrapper>
                        <Support />
                      </LanguageKeyWrapper>
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