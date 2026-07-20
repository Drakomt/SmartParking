import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import LoginForm from "./components/LoginForm";

const DashboardDummy = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-primary text-3xl font-bold mt-10">
  ! איזור למורשים בלבד
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginForm />} />
            
            <Route path="/dashboard" element={<DashboardDummy />} />
          </Routes>
        </main>
        
      </div>
    </BrowserRouter>
  );
}

export default App;