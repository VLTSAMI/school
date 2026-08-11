import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Classes from './pages/Classes';
import Scanner from './pages/Scanner';
import IDCard from './pages/IDCard';
import Stats from './pages/Stats';
import Payments from './pages/Payments';
import BottomNav from './components/BottomNav';
import './index.css';

function ConditionalBottomNav() {
  const location = useLocation();
  const hiddenPaths = ['/', '/login', '/register'];
  
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }
  
  return <BottomNav />;
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/idcard" element={<IDCard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
      <ConditionalBottomNav />
    </Router>
  );
}

export default App;
