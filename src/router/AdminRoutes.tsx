import { Navigate, Outlet } from 'react-router-dom';
import { authStorage } from '../lib/authStorage';

const AdminRoutes = () => {
  const token = authStorage.getToken();
  const role = authStorage.getRole();

  const isAuthenticated = !!token;
  const isAdmin = role === 'super-admin' || role === 'admin';

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoutes;
