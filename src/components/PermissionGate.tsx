import React from 'react';
import { useAuth } from '../context/AuthContext';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user || !user.permissions.includes(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
