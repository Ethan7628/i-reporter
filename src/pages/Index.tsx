import { Navigate } from "react-router-dom";
<<<<<<< HEAD
import { authService } from "@/services/auth.service";

const Index = () => {
  const user = authService.getCurrentUserSync();
=======
import { mockAuth } from "@/lib/mock-auth";

const Index = () => {
  const user = mockAuth.getCurrentUser();
>>>>>>> ivan
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/landing" replace />;
};

export default Index;
