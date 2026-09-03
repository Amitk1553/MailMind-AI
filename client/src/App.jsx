import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx"; 
import Dashboard from "./pages/Dashboard.jsx";

import Layout from "./components/Layout.jsx";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <> 
      <Toaster position="top-right" />
      <Routes>  
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/verify-otp" element={!user ? <VerifyOtp /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Routes */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            
            {/* These Child Routes get injected into the <Outlet /> inside Layout.jsx */}
            <Route path="/dashboard" element={<Dashboard />} />

        </Route>
      </Routes>
    </>
  );
}

export default App;