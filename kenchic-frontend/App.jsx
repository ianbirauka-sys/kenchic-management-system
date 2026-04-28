import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Products from './pages/customer/Products';
import Cart from './pages/customer/Cart';
import OrderTracking from './pages/customer/OrderTracking';

import ChickCatalog from './pages/farmer/ChickCatalog';
import FarmerOrder from './pages/farmer/FarmerOrder';
import Resources from './pages/farmer/Resources';

import Orders from './pages/employee/Orders';
import StockManagement from './pages/employee/StockManagement';
import Deliveries from './pages/employee/Deliveries';
import Reports from './pages/employee/Reports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'customer') return <Navigate to="/customer/products" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer/chicks" replace />;
  if (user.role === 'employee') return <Navigate to="/employee/orders" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer */}
          <Route path="/customer/products" element={<ProtectedRoute allowedRoles={['customer']}><Products /></ProtectedRoute>} />
          <Route path="/customer/cart" element={<ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><OrderTracking /></ProtectedRoute>} />

          {/* Farmer */}
          <Route path="/farmer/chicks" element={<ProtectedRoute allowedRoles={['farmer']}><ChickCatalog /></ProtectedRoute>} />
          <Route path="/farmer/order" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerOrder /></ProtectedRoute>} />
          <Route path="/farmer/resources" element={<ProtectedRoute allowedRoles={['farmer']}><Resources /></ProtectedRoute>} />

          {/* Employee */}
          <Route path="/employee/orders" element={<ProtectedRoute allowedRoles={['employee']}><Orders /></ProtectedRoute>} />
          <Route path="/employee/stock" element={<ProtectedRoute allowedRoles={['employee']}><StockManagement /></ProtectedRoute>} />
          <Route path="/employee/deliveries" element={<ProtectedRoute allowedRoles={['employee']}><Deliveries /></ProtectedRoute>} />
          <Route path="/employee/reports" element={<ProtectedRoute allowedRoles={['employee']}><Reports /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;