import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TournamentPage from './pages/TournamentPage'
import HistorialPage from './pages/HistorialPage'
import AdminPage from './pages/AdminPage'
import AdminLogin from './pages/AdminLogin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TournamentPage />} />
        <Route path="/historial" element={<HistorialPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
