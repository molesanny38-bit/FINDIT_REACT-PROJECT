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

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/lost-reports" element={<Placeholder title="Lost Reports" />} />
          <Route path="/claims" element={<Placeholder title="Claims Management" />} />
          <Route path="/users" element={<Placeholder title="User Management" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;