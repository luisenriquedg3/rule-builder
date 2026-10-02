import { Link, Route, Routes } from "react-router-dom";
import RulesListPage from "./pages/RulesListPage";
import RuleEditorPage from "./pages/RuleEditorPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link to="/" className="font-semibold">
            Constructor de reglas
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Routes>
          <Route path="/" element={<RulesListPage />} />
          <Route path="/rules/new" element={<RuleEditorPage />} />
          <Route path="/rules/:id" element={<RuleEditorPage />} />
          <Route path="*" element={<p>Página no encontrada</p>} />
        </Routes>
      </main>
    </div>
  );
}