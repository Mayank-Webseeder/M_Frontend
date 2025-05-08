import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const accountType = localStorage.getItem('accountType');
  return accountType ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;