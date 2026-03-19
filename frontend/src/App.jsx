import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import AskQuestion from './pages/AskQuestion';
import DoctorPanel from './pages/DoctorPanel';
import Scoreboard from './pages/Scoreboard';
import Navbar from './components/Navbar';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col pt-16">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/ask" element={<AskQuestion />} />
            <Route path="/doctor" element={<DoctorPanel />} />
            <Route path="/scoreboard" element={<Scoreboard />} />
            <Route path="/" element={<Navigate to="/auth" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
