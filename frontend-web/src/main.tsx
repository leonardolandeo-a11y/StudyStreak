import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import ToastProvider from "./components/ui/ToastProvider";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AuthProvider>
            <ToastProvider>
                <App />
            </ToastProvider>
        </AuthProvider>
    </StrictMode>
);