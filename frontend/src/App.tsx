import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FunctionLab from "./pages/FunctionLab";
import LimitLab from "./pages/LimitLab";
import IntegralLab from "./pages/IntegralLab";
import AlgebraLab from "./pages/AlgebraLab";
import GeometryLab from "./pages/GeometryLab";
import DerivativeLab from "./pages/DerivativeLab";
import StatisticsLab from "./pages/StatisticsLab";
import ModelingLab from "./pages/ModelingLab";
import ExercisesList from "./pages/ExercisesList";
import ExerciseDetail from "./pages/ExerciseDetail";
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route
  path="/functions"
  element={
    <ProtectedRoute>
      <FunctionLab />
    </ProtectedRoute>
  }
/>
          <Route path="/limits" element={<ProtectedRoute><LimitLab /></ProtectedRoute>} />
          <Route path="/integrals" element={<ProtectedRoute><IntegralLab /></ProtectedRoute>} />
          <Route path="/algebra" element={<ProtectedRoute><AlgebraLab /></ProtectedRoute>} />
          <Route path="/geometry" element={<ProtectedRoute><GeometryLab /></ProtectedRoute>} />
          <Route path="/derivatives" element={<ProtectedRoute><DerivativeLab /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><StatisticsLab /></ProtectedRoute>} />
          <Route path="/modeling" element={<ProtectedRoute><ModelingLab /></ProtectedRoute>} />
          <Route path="/exercises" element={<ProtectedRoute><ExercisesList /></ProtectedRoute>} />
          <Route path="/exercises/:id" element={<ProtectedRoute><ExerciseDetail /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;