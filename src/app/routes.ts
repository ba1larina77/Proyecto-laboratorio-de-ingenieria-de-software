import { createBrowserRouter } from "react-router";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ForgotPassword } from "./components/ForgotPassword";
import { Home } from "./components/Home";
import { Profile } from "./components/Profile";
import { Shop } from "./components/Shop";
import { ErrorBoundary } from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
    ErrorBoundary,
  },
  {
    path: "/register",
    Component: Register,
    ErrorBoundary,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
    ErrorBoundary,
  },
  {
    path: "/home",
    Component: Home,
    ErrorBoundary,
  },
  {
    path: "/profile",
    Component: Profile,
    ErrorBoundary,
  },
  {
    path: "/shop",
    Component: Shop,
    ErrorBoundary,
  },
]);