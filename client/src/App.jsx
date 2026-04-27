
import { BrowserRouter, Route,Routes } from 'react-router-dom';
import ParkinLotPage from './pages/ParkingLotPage';
import HomePage from './pages/HomePage';
import NavBar from './components/NavBar';

function App() {
  return (
    <BrowserRouter>
    <NavBar/>
       <main className='flex-grow'>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/parking" element={<ParkinLotPage/>}/>
      </Routes>
    </main>
    </BrowserRouter>
    
  )
}

export default App;