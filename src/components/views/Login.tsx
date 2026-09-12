import React from 'react';
import { LoginPage, AuthenticatedUser } from './LoginPage';

export interface UserAuthProfile {
  uid?: string;
  email: string | null;
  displayName?: string | null;
  role?: 'admin' | 'standard' | 'nodal_officer' | 'mp' | 'analyst';
  isAnonymous?: boolean;
}

interface LoginProps {
  onLoginSuccess: (user: UserAuthProfile) => void;
  onNavigateToSignUp?: () => void;
  onExplorePublic?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onExplorePublic }) => {
  const handleSuccess = (user: AuthenticatedUser) => {
    onLoginSuccess({
      email: user.email,
      displayName: user.name,
      role: user.role,
      isAnonymous: false,
    });
  };

  return <LoginPage onLoginSuccess={handleSuccess} onExplorePublic={onExplorePublic} />;
};

export default Login;

