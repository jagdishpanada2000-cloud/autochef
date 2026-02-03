import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, GuestRoute, OwnerRoute, CustomerRoute } from "@/components/ProtectedRoute";

// Public Pages
import Index from "./pages/Index";
import Restaurant from "./pages/Restaurant";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import SelectRole from "./pages/SelectRole";
import NotFound from "./pages/NotFound";

// Customer Pages
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import CustomerOrders from "./pages/Orders";
import Success from "./pages/Success";

// Owner Pages
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerOnboarding from "./pages/owner/Onboarding";
import OwnerMenuSections from "./pages/owner/MenuSections";
import OwnerMenuItems from "./pages/owner/MenuItems";
import OwnerOrders from "./pages/owner/Orders";
import OwnerSettings from "./pages/owner/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" theme="dark" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={<GuestRoute><Auth /></GuestRoute>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/select-role" element={<SelectRole />} />

            {/* Customer Routes */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={
              <CustomerRoute>
                <Checkout />
              </CustomerRoute>
            } />
            <Route path="/orders" element={
              <CustomerRoute>
                <CustomerOrders />
              </CustomerRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/success" element={<Success />} />

            {/* Owner Routes */}
            <Route path="/owner/dashboard" element={
              <OwnerRoute>
                <OwnerDashboard />
              </OwnerRoute>
            } />
            <Route path="/owner/onboarding" element={
              <OwnerRoute>
                <OwnerOnboarding />
              </OwnerRoute>
            } />
            <Route path="/owner/sections" element={
              <OwnerRoute>
                <OwnerMenuSections />
              </OwnerRoute>
            } />
            <Route path="/owner/items" element={
              <OwnerRoute>
                <OwnerMenuItems />
              </OwnerRoute>
            } />
            <Route path="/owner/orders" element={
              <OwnerRoute>
                <OwnerOrders />
              </OwnerRoute>
            } />
            <Route path="/owner/settings" element={
              <OwnerRoute>
                <OwnerSettings />
              </OwnerRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
