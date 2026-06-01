import { useEffect, useState } from 'react'
import type { PvpLastPlayEffect } from '../game/pvpBattleState'

interface FloatingCombatTextProps {
  effect: PvpLastPlayEffect | null
  mySlot: 1 | 2
}

export function FloatingCombatText({ effect, mySlot }: FloatingCombatTextProps) {
  const [visible, setVisible] = useState(false)
  const [display, setDisplay] = useState<PvpLastPlayEffect | null>(null)

  useEffect(() => {
    if (!effect) return

    setDisplay(effect)
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 1400)
    return () => window.clearTimeout(timer)
  }, [effect?.atVersion, effect?.kind, effect?.amount])

  if (!display || !visible) return null

  const onEnemy =
    display.kind === 'damage' && display.targetSlot !== mySlot
  const onMe =
    display.kind === 'block' && display.targetSlot === mySlot

  const positionClass = onEnemy
    ? 'floating-combat-text--enemy'
    : onMe
      ? 'floating-combat-text--player'
      : 'floating-combat-text--center'

  const text =
    display.kind === 'damage'
      ? `-${display.amount}`
      : `+${display.amount} block`

  return (
    <div
      className={`floating-combat-text floating-combat-text--${display.kind} ${positionClass}`}
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  )
}
