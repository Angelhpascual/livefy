"use client"

import { useState } from "react"
import type { SetlistEntry } from "@/types"
import { VotingModal } from "./VotingModal"
import { AlbumImage } from "@/components/AlbumImage"

interface SongVoteCardProps {
  entry: SetlistEntry
  sessionId: string
  hasVoted: boolean
  canVote: boolean
  bizumNumber: string | null
  onVote: (
    entryId: string,
    songId: string,
    tier: import("@/types").Tier,
    dedication?: string,
  ) => void
}

export function SongVoteCard({
  entry,
  hasVoted,
  canVote,
  bizumNumber,
  onVote,
}: SongVoteCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const song = entry.song
  const title = song?.title ?? "—"
  const artist = song?.artist ?? "—"
  const artworkUrl = song?.artwork_url ?? null
  const isPlaying = entry.status === "playing"
  const isPlayed = entry.status === "played"

  function handleTap() {
    if (hasVoted || isPlayed || !canVote) return
    setModalOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    handleTap()
  }

  function handleConfirm(tier: import("@/types").Tier, dedication?: string) {
    setModalOpen(false)
    onVote(entry.id, entry.song_id, tier, dedication)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={!isPlayed && canVote && !hasVoted ? 0 : -1}
        aria-disabled={hasVoted || isPlayed || !canVote}
        aria-label={hasVoted ? `${title} ya votada` : canVote ? `Abrir opciones para votar ${title}` : `No quedan votos para ${title}`}
        onClick={handleTap}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-3 px-4 py-2.5 active:bg-white/5 transition-colors select-none"
        style={{
          borderLeft: isPlaying ? "3px solid #1DB954" : "3px solid transparent",
          backgroundColor: isPlaying ? "#1DB95408" : "transparent",
          opacity: isPlayed ? 0.4 : !canVote && !hasVoted ? 0.55 : 1,
          cursor: !isPlayed && canVote && !hasVoted ? "pointer" : "default",
        }}
      >
        <AlbumImage artworkUrl={artworkUrl} artist={artist} title={title} size={48} rounded="md" />

        <div className="flex-1 min-w-0">
          <p
            className="text-white font-medium text-sm leading-tight truncate"
            style={{
              textDecoration: isPlayed ? "line-through" : "none",
              textDecorationColor: "#444",
            }}
          >
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs truncate" style={{ color: "#888" }}>{artist}</p>
            {entry.tier === "priority" && !isPlayed && (
              <span className="text-xs shrink-0" style={{ color: "#f59e0b" }}>⚡</span>
            )}
            {entry.tier === "next" && !isPlayed && (
              <span className="text-xs shrink-0" style={{ color: "#3b82f6" }}>🎯</span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {entry.votes > 0 && (
            <span className="text-xs tabular-nums" style={{ color: hasVoted ? "#1DB954" : "#555" }}>
              {hasVoted ? "♥" : "♡"} {entry.votes}
            </span>
          )}

          {!isPlayed && (
            <button
              onClick={(e) => { e.stopPropagation(); handleTap() }}
              disabled={hasVoted || (!canVote && !hasVoted)}
              className="rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                width: 28,
                height: 28,
                backgroundColor: hasVoted ? "transparent" : canVote ? "#1DB954" : "transparent",
                border: hasVoted ? "1.5px solid #1DB954" : canVote ? "none" : "1.5px solid #333",
                color: hasVoted ? "#1DB954" : canVote ? "#000" : "#333",
                fontSize: 13,
              }}
              aria-label={hasVoted ? "Votada" : canVote ? `Votar por ${title}` : "Sin votos"}
            >
              {hasVoted ? "♥" : "+"}
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <VotingModal
          entry={entry}
          bizumNumber={bizumNumber}
          onConfirm={handleConfirm}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
