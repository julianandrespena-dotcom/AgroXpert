import {
  createContext,
  useContext,
  useState,
} from "react";

import { ROLES } from "../data/roles";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [roleId, setRoleId] = useState(null);
  const [account, setAccount] = useState(null);

  const role = roleId
    ? ROLES[roleId]
    : null;

  const login = (
    username,
    password
  ) => {
    const foundRole =
      Object.values(ROLES).find(
        (item) =>
          item.username === username &&
          item.password === password
      );

    if (!foundRole) {
      return {
        success: false,
        message:
          "Usuario o contraseña incorrectos.",
      };
    }

    setRoleId(foundRole.id);

    return {
      success: true,
      role: foundRole,
    };
  };

  const loginWithEntra = (entraAccount) => {
    if (!entraAccount) {
      return {
        success: false,
        message:
          "No se recibió información del usuario de Microsoft.",
      };
    }

    setAccount(entraAccount);

    return {
      success: true,
      account: entraAccount,
    };
  };

  const logout = () => {
    setRoleId(null);
    setAccount(null);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        roleId,
        account,
        login,
        loginWithEntra,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}