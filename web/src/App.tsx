import { Routes, Route } from "react-router-dom";
import { TRIGGER_LABELS } from "@app/shared"; // prueba de que el workspace resuelve

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<p className="p-6">Listado ({Object.keys(TRIGGER_LABELS).length} disparadores)</p>} />
      <Route path="/rules/new" element={<p className="p-6">Editor</p>} />
      <Route path="/rules/:id" element={<p className="p-6">Editor</p>} />
    </Routes>
  );
}