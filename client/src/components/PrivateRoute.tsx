import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading, token } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  if (!user && token) {
    return <div className="flex items-center justify-center min-h-screen">사용자 정보를 불러오는 중...</div>;
  }

  return <>{children}</>;
};

export default PrivateRoute;


