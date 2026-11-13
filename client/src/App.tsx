import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Items from "./pages/items";
import Claims from "./pages/Claims";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import Matches from "./pages/Matches";

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1>{title}</h1>
      <p>This module is under development.</p>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes accessible to logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/lost-reports" element={<Placeholder title="Lost Reports" />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/matches" element={<Matches />} />
        </Route>

        {/* Admin-only route */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;