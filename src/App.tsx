import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Attendance from "./pages/Attendance";
import Homework from "./pages/Homework";
import Notices from "./pages/Notices";
import Fees from "./pages/Fees";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/students" element={<Students />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/homework" element={<Homework />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
