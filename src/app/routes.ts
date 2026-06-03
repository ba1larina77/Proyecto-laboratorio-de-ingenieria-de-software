import { createBrowserRouter } from "react-router";
import { Login }         from "./components/Login";
import { Register }      from "./components/Register";
import { ForgotPassword } from "./components/ForgotPassword";
import { Profile }       from "./components/Profile";
import { Shop }          from "./components/Shop";
import { RootDashboard } from "./components/dashboards/RootDashboard";
import { AdminCatalog }  from "./components/dashboards/AdminCatalog";
import { NewsFeed }      from "./components/news/NewsFeed";
import { ARViewer }      from "./components/ar/ARViewer";
import { ErrorBoundary } from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  // ── Pública ──────────────────────────────────────────────
  { path: "/",               Component: Shop,          ErrorBoundary },
  { path: "/login",          Component: Login,         ErrorBoundary },
  { path: "/register",       Component: Register,      ErrorBoundary },
  { path: "/forgot-password", Component: ForgotPassword, ErrorBoundary },
  { path: "/news",           Component: NewsFeed,      ErrorBoundary }, // M1-HU5
  { path: "/ar/:bookId",     Component: ARViewer,      ErrorBoundary }, // Módulo RA (scaffold)

  // ── Cliente ───────────────────────────────────────────────
  { path: "/shop",    Component: Shop,    ErrorBoundary },
  { path: "/profile", Component: Profile, ErrorBoundary },

  // ── Admin ────────────────────────────────────────────────
  { path: "/admin-catalog", Component: AdminCatalog, ErrorBoundary },

  // ── Root ─────────────────────────────────────────────────
  { path: "/root-dashboard", Component: RootDashboard, ErrorBoundary },
]);
