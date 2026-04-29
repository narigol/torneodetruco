import Link from "next/link";

export default function MembresiaPendientePage() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago pendiente</h1>
      <p className="text-gray-500 text-sm mb-8">
        Tu pago está siendo procesado. Activaremos tu membresía en cuanto se confirme.
      </p>
      <Link
        href="/membresia"
        className="inline-flex items-center gap-2 text-red-600 font-medium text-sm hover:text-red-700"
      >
        Volver a membresía
      </Link>
    </div>
  );
}
