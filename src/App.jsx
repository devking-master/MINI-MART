import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CreateListing from "./pages/CreateListing";
import ListingDetail from "./pages/ListingDetail";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

import ScrollToTop from "./components/ScrollToTop";

// Footer Pages
import SellingGuide from "./pages/SellingGuide";
import Safety from "./pages/Safety";
import Sellers from "./pages/Sellers";
import Categories from "./pages/Categories";
import HelpCenter from "./pages/HelpCenter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Refunds from "./pages/Refunds";

import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? (
    <Layout>
      {children}
    </Layout>
  ) : <Navigate to="/login" />;
}

function App() {

  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen transition-colors duration-300">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Footer Pages (Public) */}
              <Route path="/selling-guide" element={<Layout><SellingGuide /></Layout>} />
              <Route path="/safety" element={<Layout><Safety /></Layout>} />
              <Route path="/sellers" element={<Layout><Sellers /></Layout>} />
              <Route path="/categories" element={<Layout><Categories /></Layout>} />
              <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
              <Route path="/terms" element={<Layout><Terms /></Layout>} />
              <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
              <Route path="/cookies" element={<Layout><Cookies /></Layout>} />
              <Route path="/refunds" element={<Layout><Refunds /></Layout>} />

              {/* Protected Routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } />
              <Route path="/create-listing" element={
                <PrivateRoute>
                  <CreateListing />
                </PrivateRoute>
              } />
              <Route path="/listing/:id" element={
                <PrivateRoute>
                  <ListingDetail />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/chat" element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <Admin />
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>

  );
}

export default App;

