import { Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>  
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App
