import { Navigate } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";

const Index = () => {
  const user = mockAuth.getCurrentUser();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/landing" replace />;
};

export default Index;
