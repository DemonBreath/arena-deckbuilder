import { getRelic, type RelicId } from '../game/relicDatabase'

interface RelicButtonProps {
  relicId: RelicId
  disabled?: boolean
  onClick?: () => void
  owned?: boolean
}

export function RelicButton({
  relicId,
  disabled = false,
  onClick,
  owned = false,
}: RelicButtonProps) {
  const relic = getRelic(relicId)

  return (
    <button
      type="button"
      className="relic-button"
      disabled={disabled || owned}
      onClick={onClick}
    >
      <span className="relic-button__name">{relic.name}</span>
      <span className="relic-button__desc">{relic.description}</span>
      {owned && <span className="relic-button__owned">Owned</span>}
    </button>
  )
}
