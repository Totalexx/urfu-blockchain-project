"use client";

import { useMemo } from "react";
import { PollCard } from "~~/components/PollCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function ReadPollsPage() {
  const { data: totalPolls, isLoading } = useScaffoldReadContract({
    contractName: "Polls",
    functionName: "totalPolls",
  });

  const pollIds = useMemo(() => {
    if (!totalPolls) return [];
    return Array.from({ length: Number(totalPolls) }, (_, i) => i);
  }, [totalPolls]);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Опросы</h1>
        {(isLoading || isLoading === undefined) && <p className="text-base-content/60">Загрузка опросов...</p>}

        {!isLoading && totalPolls !== undefined && pollIds.length === 0 && (
          <p className="text-base-content/60">Опросы пока не созданы</p>
        )}

        {!isLoading && pollIds.length > 0 && (
          <div className="grid gap-6">
            {pollIds.map(pollId => (
              <PollCard key={pollId} pollId={pollId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}