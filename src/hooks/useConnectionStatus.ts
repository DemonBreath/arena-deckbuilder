import { useEffect, useState } from 'react'
import { createRealtimeChannelName } from '../lib/realtimeSubscription'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

export function useConnectionStatus(
  lobbyId: string | null | undefined,
): ConnectionStatus {
  const [channelStatus, setChannelStatus] = useState<ConnectionStatus>(
    'disconnected',
  )
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true)
    const onOffline = () => setBrowserOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!lobbyId || !isSupabaseConfigured()) {
      setChannelStatus('disconnected')
      return
    }

    const supabase = getSupabaseClient()
    const channel = supabase.channel(
      createRealtimeChannelName('connection-monitor', lobbyId),
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChannelStatus('connected')
      } else if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        setChannelStatus('reconnecting')
      }
    })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [lobbyId])

  if (!browserOnline) return 'disconnected'
  if (!lobbyId || !isSupabaseConfigured()) return 'disconnected'
  return channelStatus
}
