import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './auth/guards'
// Keep this import order: it decides the order the page CSS files load in.
import Home from './pages/Home/Home'
import Products from './pages/Products/Products'
import Dashboard from './pages/Dashboard/Dashboard'
import Inventory from './pages/Inventory/Inventory'
import InventoryProduct from './pages/Inventory/InventoryProduct'
import Sales from './pages/Shop/Sales'
import Suppliers from './pages/Suppliers/Suppliers'
import SupplierDetail from './pages/Suppliers/SupplierDetail'
import Login from './pages/Login/Login'
import MyOrders from './pages/MyOrders/MyOrders'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Home />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route element={<RequireRole role="Admin" />}>
          <Route path="/products" element={<Products />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:productId" element={<InventoryProduct />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
