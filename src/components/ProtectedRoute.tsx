import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'manufacturer' | 'buyer'; // Add role support
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // 1. Check if Logged In
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if Role Matches (The New Security Barrier)
  if (allowedRole && user.role !== allowedRole) {
    // If a Buyer tries to hit Admin, kick them to Home (or Search)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
