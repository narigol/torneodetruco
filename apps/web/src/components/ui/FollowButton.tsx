"use client";

import { useState, useEffect } from "react";

type Props = { organizerId: string; organizerName: string };

export function FollowButton({ organizerId, organizerName }: Props) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/seguir/${organizerId}`)
      .then((r) => r.json())
      .then((d) => setFollowing(d.following))
      .catch(() => setFollowing(false));
  }, [organizerId]);

  async function toggle() {
    if (following === null) return;
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/seguir/${organizerId}`, { method });
    if (res.ok) {
      const d = await res.json();
      setFollowing(d.following);
    }
    setLoading(false);
  }

  if (following === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
        following
          ? "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
          : "border-red-200 text-red-600 hover:bg-red-50"
      }`}
    >
      {loading ? "..." : following ? `Siguiendo a ${organizerName}` : `Seguir a ${organizerName}`}
    </button>
  );
}
