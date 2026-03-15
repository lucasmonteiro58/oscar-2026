import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Votar from './pages/Votar';
import Resultado from './pages/Resultado';
import Admin from './pages/Admin';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oscar-dark">
        <div className="animate-pulse text-oscar-gold font-display text-xl">
          Carregando...
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oscar-dark">
        <div className="animate-pulse text-oscar-gold font-display text-xl">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="/resultado" element={<Resultado />} />
      {!user ? (
        <Route path="/" element={<Login />} />
      ) : (
        <>
          <Route path="/" element={<Home />} />
          <Route
            path="/votar"
            element={
              <RequireAuth>
                <Votar />
              </RequireAuth>
            }
          />
        </>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
