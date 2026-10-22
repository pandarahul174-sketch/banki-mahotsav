import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./Layout";
import { useApp } from "./store";
import { About, Baraputra, Contact, BookDetail, Books, EventDetail, Events, Gallery, Home, NotFound, PlaceDetail, Places } from "./pages";

function FestivalToEvent() {
  const { slug } = useParams();
  return <Navigate to={`/events/${slug}`} replace />;
}

export default function App() {
  const { loading } = useApp();
  if (loading) return <div className="wrap page">Loading Banki Mahotsav…</div>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/places" element={<Places />} />
        <Route path="/places/:slug" element={<PlaceDetail />} />
        <Route path="/baraputra" element={<Baraputra />} />
        <Route path="/members" element={<Navigate to="/baraputra" replace />} />
        <Route path="/festivals" element={<Navigate to="/events" replace />} />
        <Route path="/festivals/:slug" element={<FestivalToEvent />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:slug" element={<BookDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
