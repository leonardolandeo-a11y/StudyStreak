import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";
import { AuthProvider } from "./contexts/AuthProvider";
import ToastProvider from "./components/ui/ToastProvider";
import ConfirmProvider from "./components/ui/ConfirmProvider";
import UnreadNotificationProvider from "./contexts/UnreadNotificationProvider";


createRoot(
    document.getElementById("root")!
).render(
    <AuthProvider>

        <UnreadNotificationProvider>

            <ToastProvider>

                <ConfirmProvider>
                    <App />
                </ConfirmProvider>

            </ToastProvider>

        </UnreadNotificationProvider>

    </AuthProvider>
);