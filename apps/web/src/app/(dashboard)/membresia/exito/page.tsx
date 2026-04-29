import Link from "next/link";

export default function MembresiaExitoPage() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h1>
      <p className="text-gray-500 text-sm mb-8">
        Tu membresía Organizador fue activada. Ya podés crear y gestionar torneos.
      </p>
      <Link
        href="/torneos"
        className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
      >
        Ir a torneos
      </Link>
    </div>
  );
}
