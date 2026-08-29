import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import LoginForm from "./components/LoginForm";
import AllLotsPage from "./pages/AllLotsPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentPage from "./pages/PaymentPage";
import PriceListPage from "./pages/PriceListPage";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="flex flex-col min-h-screen">
              <NavBar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/all-lots" element={<AllLotsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/price-list" element={<PriceListPage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </main>
            </div>
          </SocketProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
