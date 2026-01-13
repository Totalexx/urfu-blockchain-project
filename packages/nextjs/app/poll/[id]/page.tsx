"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { PollCard } from "~~/components/PollCard";

export default function PollPage() {
  const params = useParams();
  const rawId = params?.id;

  const pollId = useMemo(() => {
    if (!rawId || Array.isArray(rawId)) return null;

    const idNumber = Number(rawId);
    if (!Number.isInteger(idNumber) || idNumber < 0) return null;

    return idNumber;
  }, [rawId]);

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <h1 className="text-3xl font-bold my-6">Голосование</h1>

      {pollId == null && <div className="alert alert-error">Некорректный ID опроса</div>}

      {pollId !== null && <PollCard pollId={pollId} interactive />}
    </div>
  );
}
