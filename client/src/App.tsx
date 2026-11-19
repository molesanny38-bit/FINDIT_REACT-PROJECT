import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import { AccessibilityProvider } from "./context/AccessibilityContext";

import Claims from "./pages/Claims";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import Matches from "./pages/Matches";
import ActivityLogs from "./pages/ActivityLogs";
import BrowseItems from "./pages/BrowseItems";
import ItemDetails from "./pages/itemDetails";
import MyReports from "./pages/MyReports";
import Reports from "./pages/Reports";
import ManageItems from "./pages/ManageItems";
import Profile from "./pages/profile";
import Settings from "./pages/settings";

function App() {
    return (
        <AccessibilityProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Routes accessible to logged-in users with Unified AppLayout */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />

                            <Route path="/claims" element={<Claims />} />

                            <Route path="/settings" element={<Settings />} />

                            <Route path="/profile" element={<Profile />} />

                            <Route
                                path="/notifications"
                                element={<Notifications />}
                            />

                            <Route
                                path="/item-details"
                                element={<ItemDetails />}
                            />

                            <Route path="/matches" element={<Matches />} />

                            <Route
                                path="/browse-lost-items"
                                element={<BrowseItems itemType="lost" />}
                            />

                            <Route
                                path="/browse-found-items"
                                element={<BrowseItems itemType="found" />}
                            />

                            <Route path="/my-reports" element={<MyReports />} />

                            {/* Staff and Admin Routes */}
                            <Route
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "staff"]} />
                                }
                            >
                                <Route path="/reports" element={<Reports />} />
                            </Route>

                            {/* Admin-only Routes */}
                            <Route
                                element={
                                    <ProtectedRoute allowedRoles={["admin"]} />
                                }
                            >
                                <Route path="/users" element={<Users />} />

                                <Route
                                    path="/activity-logs"
                                    element={<ActivityLogs />}
                                />
                            </Route>

                            {/* Staff and Admin Item Management */}
                            <Route
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "staff"]} />
                                }
                            >
                                <Route path="/items" element={<ManageItems />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Unknown routes */}
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </BrowserRouter>
        </AccessibilityProvider>
    );
}

export default App;
