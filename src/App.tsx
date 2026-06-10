import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { ClientesPage } from './pages/ClientesPage/ClientesPage';
import { ProdutosPage } from './pages/ProdutosPage/ProdutosPage';
import { ObservacoesPage } from './pages/ObservacoesPage/ObservacoesPage';
import { OrcamentosPage } from './pages/OrcamentosPage/OrcamentosPage';
import { OrcamentoFormPage } from './pages/OrcamentoFormPage/OrcamentoFormPage';
import { OrcamentoDetailPage } from './pages/OrcamentoDetailPage/OrcamentoDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute><ProdutosPage /></ProtectedRoute>} />
          <Route path="/observacoes" element={<ProtectedRoute><ObservacoesPage /></ProtectedRoute>} />
          <Route path="/orcamentos" element={<ProtectedRoute><OrcamentosPage /></ProtectedRoute>} />
          <Route path="/orcamentos/novo" element={<ProtectedRoute><OrcamentoFormPage /></ProtectedRoute>} />
          <Route path="/orcamentos/:id/editar" element={<ProtectedRoute><OrcamentoFormPage /></ProtectedRoute>} />
          <Route path="/orcamentos/:id" element={<ProtectedRoute><OrcamentoDetailPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
