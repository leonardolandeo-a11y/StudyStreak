import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import ToastProvider from "./components/ui/ToastProvider";
import ConfirmProvider from "./components/ui/ConfirmProvider";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
      <ToastProvider>
          <ConfirmProvider>
              <App />
          </ConfirmProvider>
      </ToastProvider>
  </AuthProvider>
);  