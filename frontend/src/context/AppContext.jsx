import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { ROLES } from "../data/roles";

const AppContext =
  createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

export function AppProvider({
  children,
}) {
  const [roleId, setRoleId] =
    useState(null);

  const [account, setAccount] =
    useState(null);

  const [loadingSession, setLoadingSession] =
    useState(true);

  const role = roleId
    ? (() => {
        const baseRole =
          ROLES[roleId];

        if (!baseRole || !account) {
          return (
            baseRole || null
          );
        }

        const fullName =
          account.nombre ||
          "Usuario";

        const initials =
          fullName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
              (name) =>
                name[0]
            )
            .join("")
            .toUpperCase();

        return {
          ...baseRole,
          fullName,
          initials,
          position:
            account.cargo ||
            baseRole.name,
          scope:
            account.zona || "",
        };
      })()
    : null;

  const login = async (
    username,
    password
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              usuario:
                username,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        return {
          success: false,
          message:
            data.message ||
            "Usuario o contraseña incorrectos.",
        };
      }

      const user =
        data.user;

      if (
        !user ||
        !user.rol
      ) {
        return {
          success: false,
          message:
            "El servidor no devolvió información válida del usuario.",
        };
      }

      if (!ROLES[user.rol]) {
        return {
          success: false,
          message:
            "El rol del usuario no está configurado en la aplicación.",
        };
      }

      setRoleId(user.rol);
      setAccount(user);

      return {
        success: true,
        role:
          ROLES[user.rol],
        account: user,
      };

    } catch (error) {
      console.error(
        "Error conectando con el backend:",
        error
      );

      return {
        success: false,
        message:
          "No fue posible conectar con el servidor.",
      };
    }
  };

  const restoreSession =
    async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/auth/me`,
            {
              method: "GET",
              credentials:
                "include",
            }
          );

        if (!response.ok) {
          setRoleId(null);
          setAccount(null);
          return;
        }

        const data =
          await response.json();

        if (
          !data.success ||
          !data.user ||
          !data.user.rol
        ) {
          setRoleId(null);
          setAccount(null);
          return;
        }

        if (
          !ROLES[
            data.user.rol
          ]
        ) {
          setRoleId(null);
          setAccount(null);
          return;
        }

        setRoleId(
          data.user.rol
        );

        setAccount(
          data.user
        );

      } catch (error) {
        console.error(
          "Error restaurando sesión:",
          error
        );

        setRoleId(null);
        setAccount(null);

      } finally {
        setLoadingSession(
          false
        );
      }
    };

  const logout =
    async () => {
      try {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );
      } catch (error) {
        console.error(
          "Error cerrando sesión:",
          error
        );
      } finally {
        setRoleId(null);
        setAccount(null);
      }
    };

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        roleId,
        account,
        login,
        logout,
        loadingSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(
    AppContext
  );
}