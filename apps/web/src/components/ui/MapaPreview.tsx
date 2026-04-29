"use client";

type Props = { location: string };

export function MapaPreview({ location }: Props) {
  const query = location.trim();
  if (!query) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const mapsUrl = query.startsWith("http")
    ? query
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (apiKey) {
    const src = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(query)}&language=es`;
    return (
      <div>
        <div className="rounded-xl overflow-hidden border border-gray-100 h-48 mt-3">
          <iframe
            src={src}
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver en Google Maps →
        </a>
      </div>
    );
  }

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Ver en Google Maps
    </a>
  );
}
