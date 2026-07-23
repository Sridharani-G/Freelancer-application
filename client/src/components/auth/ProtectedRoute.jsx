import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getRoleDashboardPath } from '../../utils/rolePaths';

export default function ProtectedRoute({ allowedRoles }) {
    const { isAuthenticated, user } = useSelector((s) => s.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to={getRoleDashboardPath(user?.role) || '/'} replace />;
    }

    return <Outlet />;
}
