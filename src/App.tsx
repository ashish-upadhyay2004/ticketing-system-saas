import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";

// Pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";
import Dashboard from "./pages/Dashboard";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// User
import UserDashboard from "./pages/user/UserDashboard";
import UserTickets from "./pages/user/UserTickets";
import NewTicket from "./pages/user/NewTicket";
import UserTicketDetail from "./pages/user/TicketDetail";


// Agent
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentTickets from "./pages/agent/AgentTickets";
import AgentTicketDetail from "./pages/agent/AgentTicketDetail";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminTicketDetail from "./pages/admin/AdminTicketDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminTags from "./pages/admin/AdminTags";
import AdminSLARules from "./pages/admin/AdminSLARules";
import AdminAutomation from "./pages/admin/AdminAutomation";
import AdminKnowledgeBase from "./pages/admin/AdminKnowledgeBase";
import AdminReports from "./pages/admin/AdminReports";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

// Shared
import Notifications from "./pages/Notifications";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* Dashboard Routes - Protected */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* User Routes */}
<Route path="/user" element={<DashboardLayout requiredRole="user" />}>
  <Route path="dashboard" element={<UserDashboard />} />
  <Route path="tickets" element={<UserTickets />} />
  <Route path="tickets/new" element={<NewTicket />} />
  <Route path="tickets/:id" element={<UserTicketDetail />} />
  <Route path="profile" element={<Profile />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>

{/* Agent Routes */}
<Route path="/agent" element={<DashboardLayout requiredRole="agent" />}>
  <Route path="dashboard" element={<AgentDashboard />} />
  <Route path="tickets" element={<AgentTickets />} />
  <Route path="tickets/:id" element={<AgentTicketDetail />} />
  <Route path="profile" element={<Profile />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>

{/* Admin Routes */}
<Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="tickets" element={<AdminTickets />} />
  <Route path="tickets/:id" element={<AdminTicketDetail />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="teams" element={<AdminTeams />} />
  <Route path="categories" element={<AdminCategories />} />
  <Route path="tags" element={<AdminTags />} />
  <Route path="sla-rules" element={<AdminSLARules />} />
  <Route path="automation" element={<AdminAutomation />} />
  <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
  <Route path="reports" element={<AdminReports />} />
  <Route path="audit-logs" element={<AdminAuditLogs />} />
  <Route path="profile" element={<Profile />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>


              {/* Shared Protected Routes */}
              <Route path="/notifications" element={<DashboardLayout />}>
                <Route index element={<Notifications />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
