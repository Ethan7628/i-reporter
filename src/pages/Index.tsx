import { Navigate } from "react-router-dom";
import { authService } from "@/services/auth.service";

const Index = () => {
  const user = authService.getCurrentUserSync();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/landing" replace />;
};

export default Index;
