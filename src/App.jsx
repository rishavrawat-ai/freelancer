import PropTypes from "prop-types";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/components/home/Home.jsx";
import Client from "@/components/client/Client.jsx";
import ClientDashboard from "@/components/client/ClientDashboard.jsx";
import { ThemeProvider } from "./components/theme-provider";
import Navbar from "./components/Navbar";
import SignupPage from "./components/forms/Signup";
import LoginPage from "./components/forms/Login";
import FreelancerDashboard from "@/components/freelancer/FreelancerDashboard";
import FreelancerProfile from "@/components/freelancer/FreelancerProfile";
import { useAuth } from "@/context/AuthContext";
import  FreelancerMultiStepForm  from "./components/freelancer/multi-step-form";

const App = () => {
  return (
    <main>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route
            path="/"
            element={
              <LayoutWithNavbar>
                <Home />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/signup"
            element={
                <SignupPage />
            }
          />
          <Route
            path="/login"
            element={
              <LayoutWithNavbar>
                <LoginPage />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/client"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/service"
            element={
              <LayoutWithNavbar>
                <Client />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/freelancer"
            element={
              <ProtectedRoute>
                <FreelancerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/onboarding"
            element={
              <LayoutWithNavbar>
                <FreelancerMultiStepForm />
              </LayoutWithNavbar>
            }
          />
          <Route
            path="/freelancer/profile"
            element={
              <ProtectedRoute>
                <FreelancerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <LayoutWithNavbar>
                <NotFound />
              </LayoutWithNavbar>
            }
          />
        </Routes>
      </ThemeProvider>
    </main>
  );
};

const LayoutWithNavbar = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

LayoutWithNavbar.propTypes = {
  children: PropTypes.node.isRequired,
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const NotFound = () => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
    <p className="text-sm uppercase tracking-[0.3em] text-emerald-400/80">
      404
    </p>
    <h1 className="text-3xl md:text-4xl font-light">Page not found</h1>
    <p className="text-emerald-50/70 max-w-md">
      The route you are looking for doesn&apos;t exist. Use the main navigation
      to head back home.
    </p>
  </main>
);

export default App;
