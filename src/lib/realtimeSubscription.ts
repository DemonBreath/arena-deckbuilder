import type { SupabaseClient } from '@supabase/supabase-js'
import { logOnlineError } from './onlineLog'

export interface PostgresChangeListener {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  table: string
  filter?: string
  callback: () => void
}

let channelInstanceSeq = 0

/** Unique Supabase Realtime channel name (avoids reusing an already-subscribed channel). */
export function createRealtimeChannelName(
  channelPrefix: string,
  scopeId: string,
): string {
  return `${channelPrefix}:${scopeId}:${++channelInstanceSeq}`
}

/**
 * Subscribe to one or more postgres_changes filters on a dedicated channel.
 * Each call uses a unique channel name so multiple hooks can listen to the
 * same table/filter without calling .on() after .subscribe() on a reused channel.
 * Returns a no-op unsubscribe if setup fails so callers do not crash.
 */
export function subscribePostgresChanges(
  supabase: SupabaseClient,
  channelPrefix: string,
  scopeId: string,
  listeners: PostgresChangeListener[],
): () => void {
  try {
    const channelName = createRealtimeChannelName(channelPrefix, scopeId)

    let channel = supabase.channel(channelName)

    for (const listener of listeners) {
      channel = channel.on(
        'postgres_changes',
        {
          event: listener.event ?? '*',
          schema: listener.schema ?? 'public',
          table: listener.table,
          filter: listener.filter,
        },
        () => {
          try {
            listener.callback()
          } catch (err) {
            logOnlineError(`realtime:callback:${channelPrefix}`, err)
          }
        },
      )
    }

    const subscribedChannel = channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logOnlineError(`realtime:channel:${channelPrefix}`, err ?? status)
      }
    })

    return () => {
      try {
        void supabase.removeChannel(subscribedChannel)
      } catch (err) {
        logOnlineError(`realtime:unsub:${channelPrefix}`, err)
      }
    }
  } catch (err) {
    logOnlineError(`realtime:subscribe:${channelPrefix}`, err)
    return () => {}
  }
}
