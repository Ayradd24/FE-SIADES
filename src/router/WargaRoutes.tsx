import { Navigate, Outlet } from 'react-router-dom';

const WargaRoutes = () => {
  const token = localStorage.getItem('siades_token');
  const role = localStorage.getItem('siades_role');

  const isAuthenticated = !!token;
  // Memastikan role bukan admin (misalnya role === 'user' atau 'warga')
  const isWarga = role === 'user' || role === 'warga';

  if (!isAuthenticated || !isWarga) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default WargaRoutes;
