import Login from "./pages/Login";
import AppShell from "./components/layout/AppShell";
import { useApp } from "./context/AppContext";

export default function App() {
  const { role } = useApp();

  if (!role) {
    return <Login />;
  }

  return <AppShell />;
}