import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewReport from "./pages/NewReport";
import EditReport from "./pages/EditReport";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { authService } from "./services/auth.service";

const queryClient = new QueryClient();
 
// Development only: Make specific user an admin
authService.makeAdmin('kusasirakwe.ethan.upti@gmail.com');

const App = () => (

  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      
  {/* Sonner toaster removed so the custom Toaster overlay is used */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report/new" element={<NewReport />} />
          <Route path="/report/:id/edit" element={<EditReport />} />
          <Route path="/admin" element={<Admin />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  <ToastContainer position="top-center" newestOnTop />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
