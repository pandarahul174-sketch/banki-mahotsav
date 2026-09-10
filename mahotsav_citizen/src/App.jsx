import { Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { useApp } from "./store";
import { About, Auth, Cart, Contact, FestivalDetail, Festivals, Gallery, HistoryDetail, Home, NotFound, Offerings, Policies, ProductDetail, PujaDetail, Pujas, Store } from "./pages";

export default function App() {
  const { loading } = useApp();
  if (loading) return <div className="wrap page">Loading Banki Mahotsav…</div>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/history/:slug" element={<HistoryDetail />} />
        <Route path="/pujas" element={<Pujas />} />
        <Route path="/pujas/:slug" element={<PujaDetail />} />
        <Route path="/festivals" element={<Festivals />} />
        <Route path="/festivals/:slug" element={<FestivalDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/store" element={<Store />} />
        <Route path="/store/:slug" element={<ProductDetail />} />
        <Route path="/offerings" element={<Offerings />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
