import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import CookieConsent from "./components/CookieConsent";
import AppErrorBoundary from "./components/AppErrorBoundary";

const HomePage = lazy(() => import("./pages/HomePage"));
const AllLotsPage = lazy(() => import("./pages/AllLotsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const PriceListPage = lazy(() => import("./pages/PriceListPage"));
const LoginForm = lazy(() => import("./components/LoginForm"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-primary">
    <span className="material-symbols-outlined animate-spin text-3xl" aria-label="טוען">progress_activity</span>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <SocketProvider>
            <AppErrorBoundary>
              <div className="flex flex-col min-h-screen">
                <NavBar />
                <main className="flex-grow">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/all-lots" element={<AllLotsPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/price-list" element={<PriceListPage />} />
                      <Route path="/login" element={<LoginForm />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <CookieConsent />
              </div>
            </AppErrorBoundary>
          </SocketProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
