import { PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const authority = import.meta.env.VITE_ENTRA_AUTHORITY;
const redirectUri =
  import.meta.env.VITE_ENTRA_REDIRECT_URI ||
  window.location.origin;

if (!clientId || !authority) {
  throw new Error(
    "Falta configurar VITE_ENTRA_CLIENT_ID o VITE_ENTRA_AUTHORITY."
  );
}

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority,
    redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
});

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
