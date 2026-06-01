import { PVP_EMOTES, type PvpEmoteId } from '../game/pvpBattleState'

interface PvpEmoteBarProps {
  disabled?: boolean
  opponentEmoteLabel: string | null
  onSend: (emoteId: PvpEmoteId) => void
}

export function PvpEmoteBar({
  disabled = false,
  opponentEmoteLabel,
  onSend,
}: PvpEmoteBarProps) {
  return (
    <div className="pvp-emote-bar">
      <span className="pvp-emote-bar__label">Quick emotes</span>
      <div className="pvp-emote-bar__buttons">
        {PVP_EMOTES.map((emote) => (
          <button
            key={emote.id}
            type="button"
            className="pvp-emote-button"
            disabled={disabled}
            onClick={() => onSend(emote.id)}
          >
            {emote.label}
          </button>
        ))}
      </div>
      {opponentEmoteLabel && (
        <p className="pvp-emote-bar__opponent" role="status">
          Opponent: <strong>{opponentEmoteLabel}</strong>
        </p>
      )}
    </div>
  )
}
