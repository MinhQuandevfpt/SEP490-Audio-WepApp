import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage/HomePage';
import Login from '../pages/Customer/Login';
import Register from '../pages/Customer/Register';
import AuthLayout from '../components/AuthLayout';
import Profile from '../pages/Customer/Profile';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/account',
    element: <Profile />
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      }
    ]
  }
]);