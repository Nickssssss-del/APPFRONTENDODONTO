import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import DiagnosticoConexion from './screens/DiagnosticoConexion';
import './index.css';

// Pantalla de pruebas de conexión: http://localhost:5173/?diagnostico=1  (quítala antes de publicar)
const Root = new URLSearchParams(window.location.search).has('diagnostico') ? DiagnosticoConexion : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>
);