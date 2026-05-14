import { Navigate, Outlet } from 'react-router-dom';
import { authStorage } from '../lib/authStorage';

const WargaRoutes = () => {
  const token = authStorage.getToken();
  const role = authStorage.getRole();
  const mustUpdateCredentials = authStorage.getMustUpdateCredentials();

  const isAuthenticated = !!token;
  // Memastikan role bukan admin (misalnya role === 'user' atau 'warga')
  const isWarga = role === 'user' || role === 'warga';

  if (!isAuthenticated || !isWarga) {
    return <Navigate to="/login" replace />;
  }

  if (mustUpdateCredentials) {
    return <Navigate to="/warga/setup-akun" replace />;
  }

  return <Outlet />;
};

export default WargaRoutes;
