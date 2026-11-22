import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  // Remember the page they wanted, so signing in brings them straight back to it.
  return token ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export default PrivateRoute;
