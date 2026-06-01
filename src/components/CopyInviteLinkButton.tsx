import { useCallback, useEffect, useRef, useState } from 'react'
import { buildLobbyInviteUrl } from '../lib/lobbyRouting'

interface CopyInviteLinkButtonProps {
  lobbyCode: string
  className?: string
}

export function CopyInviteLinkButton({
  lobbyCode,
  className = 'secondary-button',
}: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const handleCopy = useCallback(async () => {
    const url = buildLobbyInviteUrl(lobbyCode)

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy this invite link:', url)
    }
  }, [lobbyCode])

  return (
    <button
      type="button"
      className={`${className} copy-invite-button${copied ? ' copy-invite-button--copied' : ''}`}
      onClick={() => void handleCopy()}
    >
      {copied ? 'Copied!' : 'Copy Invite Link'}
    </button>
  )
}
