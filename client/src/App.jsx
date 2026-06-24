import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

// Import all your pages
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx"; 
import Dashboard from "./pages/Dashboard.jsx";

// 1. IMPORT YOUR NEW LAYOUT COMPONENT
import Layout from "./components/Layout.jsx"; // <-- Adjust this path if you saved Layout.jsx in a different folder!

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
        
        {/* 2. NESTED PROTECTED ROUTES */}
        {/* This Parent Route checks if the user is logged in, and if so, renders the Layout with the Sidebar/Navbar */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            
            {/* These Child Routes get injected into the <Outlet /> inside Layout.jsx */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* If you build a Profile or Settings page later, you just drop them right here! */}
            {/* <Route path="/settings" element={<Settings />} /> */}

        </Route>
      </Routes>
    </>
  );
}

export default App;