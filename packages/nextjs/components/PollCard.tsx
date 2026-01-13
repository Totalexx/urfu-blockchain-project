"use client";

import { useState } from "react";
import Link from "next/link";
import { useWalletClient } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type PollCardProps = {
  pollId: number;
  interactive?: boolean;
};

export function PollCard({ pollId, interactive = false }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();

  const { data: contract, isLoading: contractLoading } = useScaffoldContract({
    contractName: "Polls",
    walletClient,
  });

  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "Polls",
    functionName: "getPoll",
    args: [BigInt(pollId)],
  });

  const loading = contractLoading || isLoading;

  if (loading) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <span className="loading loading-spinner loading-sm" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body text-error">Некорректный id опроса #{pollId}</div>
      </div>
    );
  }

  const [question, options, votes] = data;

  const totalVotes = votes.reduce((sum: number, v: bigint) => sum + Number(v), 0);
  const maxVotes = totalVotes > 0 ? Math.max(...votes.map((v: bigint) => Number(v))) : 0;

  const handleVote = async () => {
    if (selectedOption === null) return;
    if (!contract) return;

    setError(null);
    setSuccess(null);

    try {
      console.log([BigInt(pollId), BigInt(selectedOption)]);
      await contract.write.vote([BigInt(pollId), BigInt(selectedOption)]);
      setSuccess("Голос отправлен");
      await refetch();
    } catch (e: any) {
      const message = e?.message || "";

      if (message.includes("Sender doesn't have enough funds")) {
        setError("У вас недостаточно ETH для отправки транзакции");
        return;
      }

      if (message.includes("You already voted")) {
        setError("Вы уже голосовали в этом опросе");
        return;
      }

      setError("Ошибка транзакции: " + e.shortMessage);
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <span className="badge badge-outline">#{pollId}</span>
            {question}
          </h2>

          <span className="badge badge-ghost">{totalVotes} голосов</span>
        </div>

        <div className="flex flex-col gap-3">
          {options.map((option: string, index: number) => {
            const voteCount = Number(votes[index]);
            const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            const isWinner = totalVotes > 0 && voteCount === maxVotes && maxVotes > 0;
            const isSelected = selectedOption === index;

            return (
              <label
                key={index}
                className={`
                  rounded-lg border p-3 transition
                  ${isWinner && !interactive ? "border-success" : "border-base-300"}
                  ${interactive ? "cursor-pointer" : ""}
                  ${isSelected ? "bg-primary/10" : ""}
                `}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium flex items-center gap-2">
                    {interactive && (
                      <input
                        type="radio"
                        className={`radio ${isSelected ? "" : "radio-primary"} radio-sm`}
                        checked={isSelected}
                        onChange={() => setSelectedOption(index)}
                      />
                    )}
                    {option}
                  </span>

                  <span className="text-base-content/60">
                    {voteCount} • {percent}%
                  </span>
                </div>

                <progress
                  className={`progress w-full ${isWinner && totalVotes > 0 && !interactive ? "progress-success" : "progress-primary"}`}
                  value={percent}
                  max={100}
                />
              </label>
            );
          })}
        </div>

        {error && <div className="text-error">{error}</div>}
        {success && <div className="text-success">{success}</div>}

        {interactive && (
          <button className="btn btn-primary mt-4" disabled={selectedOption === null} onClick={handleVote}>
            Проголосовать
          </button>
        )}

        {!interactive && <Link className="btn btn-primary mt-4" href={`/poll/${pollId}`}>Открыть для голосование</Link>}
      </div>
    </div>
  );
}
