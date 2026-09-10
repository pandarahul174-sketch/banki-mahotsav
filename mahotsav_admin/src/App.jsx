import { Route, Routes } from "react-router-dom";
import { AdminApp, AdminLogin } from "./Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/*" element={<AdminApp />} />
    </Routes>
  );
}
