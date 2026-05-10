import { BrowserRouter, Route, Routes } from "react-router-dom";
import ParkinLotPage from "./pages/ParkingLotPage";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-slate-900">
        <NavBar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/parking" element={<ParkinLotPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
