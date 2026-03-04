import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, accessToken } = useAuthStore();

    if (!accessToken || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.vaiTro)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
