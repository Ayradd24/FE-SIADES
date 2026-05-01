import { Navigate, Outlet } from 'react-router-dom';

const AdminRoutes = () => {
  const token = localStorage.getItem('siades_token');
  const role = localStorage.getItem('siades_role');

  const isAuthenticated = !!token;
  const isAdmin = role === 'admin' || role === 'ADMIN';

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoutes;
