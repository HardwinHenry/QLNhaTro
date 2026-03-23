import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import RoomsPage from "./pages/RoomsPage";
import InvoicesPage from "./pages/InvoicesPage";
import ContractsPage from "./pages/ContractsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import UtilitiesPage from "./pages/UtilitiesPage";
import BookingsPage from "./pages/BookingsPage";
import CustomersPage from "./pages/CustomersPage";
import RentedRoomsPage from "./pages/RentedRoomsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Tất cả user đã đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout><Outlet /></MainLayout>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rented-rooms" element={<RentedRoomsPage />} />
            <Route path="/rooms/:id" element={<RoomDetailPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/utilities" element={<UtilitiesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
          </Route>
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
