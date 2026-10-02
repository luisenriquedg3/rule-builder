import { Link, useParams } from "react-router-dom";
import { useRule } from "../api/rules";
import RuleEditor from "./editor/RuleEditor";

export default function RuleEditorPage() {
  const { id } = useParams();
  const { data, isPending, isError, error, refetch } = useRule(id);

  if (!id) return <RuleEditor />;
  if (isPending) return <p className="text-slate-500">Cargando regla…</p>;
  if (isError)
    return (
      <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        <p>{error.status === 404 ? "La regla no existe." : `No se pudo cargar la regla: ${error.message}`}</p>
        <div className="mt-2 flex gap-4">
          {error.status !== 404 && <button onClick={() => refetch()} className="font-medium underline">Reintentar</button>}
          <Link to="/" className="font-medium underline">Volver al listado</Link>
        </div>
      </div>
    );

  return <RuleEditor key={data.id} initial={data} />;
}