"use client"

import { useState, useEffect, useCallback } from "react"
import { Song } from "@/types"

async function loadSongs(): Promise<Song[]> {
  const res = await fetch("/api/songs")
  if (!res.ok) throw new Error("Failed to fetch songs")
  return res.json() as Promise<Song[]>
}

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSongs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loadSongs()
      setSongs([...data].sort(() => Math.random() - 0.5))
    } catch (error) {
      console.error("useSongs error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSongs()
      .then((data) => setSongs([...data].sort(() => Math.random() - 0.5)))
      .catch((error) => console.error("useSongs error:", error))
      .finally(() => setLoading(false))
  }, [])

  return { songs, loading, refetch: fetchSongs }
}
