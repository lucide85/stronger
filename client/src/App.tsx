import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./api/auth";
import { NavBar } from "./components/NavBar";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Strength } from "./pages/Strength";
import { SessionLogger } from "./pages/SessionLogger";
import { Running } from "./pages/Running";
import { Measure } from "./pages/Measure";
import { Settings } from "./pages/Settings";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, isReady } = useAuth();
  const location = useLocation();
  if (!isReady) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const hideNav = location.pathname === "/login";

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/strength"
          element={
            <RequireAuth>
              <Strength />
            </RequireAuth>
          }
        />
        <Route
          path="/strength/session/:sessionId"
          element={
            <RequireAuth>
              <SessionLogger />
            </RequireAuth>
          }
        />
        <Route
          path="/running"
          element={
            <RequireAuth>
              <Running />
            </RequireAuth>
          }
        />
        <Route
          path="/measure"
          element={
            <RequireAuth>
              <Measure />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
      </Routes>
      {!hideNav && <NavBar />}
    </>
  );
}
