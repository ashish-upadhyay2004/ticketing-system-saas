import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const role = profile.role;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "agent") return <Navigate to="/agent/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
};

export default Dashboard;
