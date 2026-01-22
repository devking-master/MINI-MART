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

import Layout from "./components/Layout";

import { CallProvider } from "./context/CallContext";
import GlobalCallUI from "./GlobalCallUI";

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
      <ThemeProvider>
        <AuthProvider>
          <CallProvider>
            <GlobalCallUI />
            <div className="min-h-screen transition-colors duration-300">


              <Routes>

                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

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
              </Routes>
            </div>
          </CallProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>

  );
}

export default App;

