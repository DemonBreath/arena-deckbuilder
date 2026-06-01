import { getClassDefinition } from '../game/classDatabase'
import type { SpectatorBattleView } from '../game/pvpBattleState'
import {
  useOnlineRunStatus,
  type OnlineRunSession,
} from '../hooks/useOnlineRunStatus'
import { BattleLogPanel } from './BattleLogPanel'
import { FloatingCombatText } from './FloatingCombatText'
import { PvpRunStatusHeader } from './PvpRunStatusHeader'
import { PvpTurnTimer } from './PvpTurnTimer'

interface SpectatorCombatViewProps {
  session: OnlineRunSession
  view: SpectatorBattleView
  stateVersion: number
  turnStartAt: string | null
  matchLabel: string
  onBack: () => void
}

export function SpectatorCombatView({
  session,
  view,
  stateVersion,
  turnStartAt,
  matchLabel,
  onBack,
}: SpectatorCombatViewProps) {
  const runStatus = useOnlineRunStatus(session)

  if (!runStatus) {
    return (
      <div className="battle-view spectator-combat-view">
        <p>Loading match…</p>
      </div>
    )
  }

  const turnBanner = view.isCompleted
    ? view.winnerName
      ? `${view.winnerName} won the match`
      : 'Match complete'
    : view.activePlayerName
      ? `${view.activePlayerName}'s turn`
      : 'Waiting for battle…'

  return (
    <div className="battle-view spectator-combat-view">
      <PvpRunStatusHeader status={runStatus} title="Spectating" />

      <p className="spectator-combat-view__match-label">{matchLabel}</p>
      <PvpTurnTimer
        turnStartAt={turnStartAt}
        isMyTurn={view.phase === 'active'}
        battleActive={view.phase === 'active'}
      />
      <p
        className={`pvp-turn-banner ${
          view.isCompleted
            ? 'pvp-turn-banner--waiting'
            : 'pvp-turn-banner--yours'
        }`}
      >
        {turnBanner}
      </p>
      <p className="spectator-readonly-banner" role="status">
        Read-only view — cards and actions are disabled.
      </p>

      <div className="battle-view__main">
        <div className="battle-view__combat">
          <div className="battle-view__arena battle-view__arena--pvp">
            <FloatingCombatText
              effect={view.lastEffect}
              mySlot={view.activeSlot}
            />

            <section className="fighter-panel fighter-panel--enemy">
              <h3>{view.player1.championName}</h3>
              <p className="fighter-archetype">
                {getClassDefinition(view.player1.classId).name}
              </p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, view.player1.hp)} / {view.player1.maxHp}
                </strong>
              </p>
              <p className="stat-line">Block: {view.player1.block}</p>
              <p className="stat-line">
                Energy: {view.player1.energy} / {view.player1.maxEnergy}
              </p>
              <p className="stat-line">Hand: {view.player1.handSize} cards</p>
            </section>

            <section className="fighter-panel fighter-panel--player">
              <h3>{view.player2.championName}</h3>
              <p className="fighter-archetype">
                {getClassDefinition(view.player2.classId).name}
              </p>
              <p className="hp-bar">
                <span>HP</span>
                <strong>
                  {Math.max(0, view.player2.hp)} / {view.player2.maxHp}
                </strong>
              </p>
              <p className="stat-line">Block: {view.player2.block}</p>
              <p className="stat-line">
                Energy: {view.player2.energy} / {view.player2.maxEnergy}
              </p>
              <p className="stat-line">Hand: {view.player2.handSize} cards</p>
            </section>
          </div>

          <p className="battle-message">{view.message}</p>

          <button
            type="button"
            className="secondary-button"
            onClick={onBack}
          >
            Back to Spectator Hub
          </button>
        </div>

        <BattleLogPanel entries={view.battleLog} />
      </div>

      <p className="spectator-sync-hint" aria-live="polite">
        Live sync v{stateVersion}
      </p>
    </div>
  )
}
