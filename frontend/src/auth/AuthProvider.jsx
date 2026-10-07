import { useEffect } from "react";
import { PublicClientApplication, EventType} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export default function AuthProvider({ children }) {
    useEffect(() => {
        const initializeMsal = async () => {
            
            try{
                await msalInstance.initialize();

                const accounts = msalInstance.getAllAccounts();

                if (accounts.length > 0) {
                    msalInstance.setActiveAccount(accounts[0]);
                }

                msalInstance.addEventCallback((event) => {
                    if (event.eventType === EventType.LOGIN_SUCCESS) {
                        const account = event.payload?.account;

                        if (account) {
                            msalInstance.setActiveAccount(account);
                        }
                    }
                });
            } catch (error) {
                console.error("Error inicializando Microsoft Entra ID:", error);
            }
        };

        initializeMsal();
    }, []);

    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
}

export { msalInstance };