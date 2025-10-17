import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminBooks from "./pages/admin/Books";
import AdminBorrows from "./pages/admin/Borrows";
import AdminServices from "./pages/admin/Services";
import AdminSettings from "./pages/admin/Settings";

// Librarian Pages
import LibrarianDashboard from "./pages/librarian/Dashboard";
import LibrarianCopies from "./pages/librarian/Copies";

// Member Pages
import MemberBrowse from "./pages/member/Browse";
import MemberBorrows from "./pages/member/Borrows";
import MemberHistory from "./pages/member/History";
import BookDetails from "./pages/BookDetail";
import MemberProfile from "./pages/member/profile";
const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const getRoleRedirect = () => {
    if (!user) return "/auth/login";

    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "librarian":
        return "/librarian/dashboard";
      case "member":
        return "/member/browse";
      default:
        return "/";
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/auth/login"
        element={user ? <Navigate to={getRoleRedirect()} replace /> : <Login />}
      />
      <Route
        path="/auth/register"
        element={
          user ? <Navigate to={getRoleRedirect()} replace /> : <Register />
        }
      />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminUsers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminBooks />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/borrows"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminBorrows />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminServices />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <MemberProfile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Librarian Routes */}
      <Route
        path="/librarian/dashboard"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <DashboardLayout>
              <LibrarianDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/users"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <DashboardLayout>
              <AdminUsers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/copies"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <DashboardLayout>
              <LibrarianCopies />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/borrows"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <DashboardLayout>
              <AdminBorrows />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/dashboard"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <DashboardLayout>
              <LibrarianDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Member Routes */}
      <Route
        path="/member/browse"
        element={
          <ProtectedRoute allowedRoles={["member"]}>
            <DashboardLayout>
              <MemberBrowse />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/borrows"
        element={
          <ProtectedRoute allowedRoles={["member"]}>
            <DashboardLayout>
              <MemberBorrows />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/history"
        element={
          <ProtectedRoute allowedRoles={["member"]}>
            <DashboardLayout>
              <MemberHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/profile"
        element={
          <ProtectedRoute allowedRoles={["member"]}>
            <DashboardLayout>
              <MemberProfile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <DashboardLayout>
            <MemberProfile />
          </DashboardLayout>
        }
      />

      <Route path="/books/:bookId" element={<BookDetails />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
