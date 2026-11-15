import { createRoot } from "react-dom/client";


import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthProvider";
import ToastProvider from "./components/ui/ToastProvider";
import ConfirmProvider from "./components/ui/ConfirmProvider";
import UnreadNotificationProvider from "./contexts/UnreadNotificationProvider";


createRoot(
    document.getElementById("root")!
).render(
    <ErrorBoundary>
    <AuthProvider>
    <ThemeProvider>

        <UnreadNotificationProvider>

            <ToastProvider>

                <ConfirmProvider>
                    <App />
                </ConfirmProvider>

            </ToastProvider>

        </UnreadNotificationProvider>

    </ThemeProvider>
    </AuthProvider>
    </ErrorBoundary>
);