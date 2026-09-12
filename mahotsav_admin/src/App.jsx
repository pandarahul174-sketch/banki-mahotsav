import { Route, Routes } from "react-router-dom";
import { AboutSettings, AdminApp, AdminLogin, BooksPage, Dashboard, EventsPage, GalleryPage, MessagesPage, SettingsEditor } from "./Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<AdminApp />}>
        <Route index element={<Dashboard />} />
        <Route path="about" element={<AboutSettings />} />
        <Route path="settings" element={<SettingsEditor />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="messages" element={<MessagesPage />} />
      </Route>
    </Routes>
  );
}
