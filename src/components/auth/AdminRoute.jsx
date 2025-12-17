import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ redirectTo: location.pathname }} replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to={user?.role === "CLIENT" ? "/client" : "/freelancer"} replace />;
  }

  return children;
};

export default AdminRoute;
