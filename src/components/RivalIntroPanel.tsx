import type { RivalMatchIntro } from '../types/rivals'
import { RivalBadge } from './RivalBadge'

interface RivalIntroPanelProps {
  rival: RivalMatchIntro
  yourName: string
  opponentDisplayTitle: string
}

export function RivalIntroPanel({
  rival,
  yourName,
  opponentDisplayTitle,
}: RivalIntroPanelProps) {
  return (
    <section className="rival-intro-panel" aria-labelledby="rival-intro-title">
      <header className="rival-intro-panel__banner">
        <RivalBadge />
        <h3 id="rival-intro-title" className="rival-intro-panel__title">
          Rival match
        </h3>
      </header>

      <div className="rival-intro-panel__matchup">
        <div className="rival-intro-panel__fighter">
          <span className="rival-intro-panel__fighter-label">You</span>
          <strong>{yourName}</strong>
        </div>
        <span className="rival-intro-panel__vs" aria-hidden>
          vs
        </span>
        <div className="rival-intro-panel__fighter rival-intro-panel__fighter--opponent">
          <span className="rival-intro-panel__fighter-label">Rival</span>
          <strong>{rival.opponentName}</strong>
          <span className="rival-intro-panel__class">{opponentDisplayTitle}</span>
        </div>
      </div>

      <dl className="rival-intro-panel__facts">
        {rival.previousResultLine && (
          <div className="rival-intro-panel__fact">
            <dt>Previous</dt>
            <dd>{rival.previousResultLine}</dd>
          </div>
        )}
        <div className="rival-intro-panel__fact">
          <dt>Record</dt>
          <dd>
            <strong className="rival-intro-panel__record">
              {rival.recordLine}
            </strong>
            <span className="rival-intro-panel__record-hint">
              (you — rival)
            </span>
          </dd>
        </div>
      </dl>

      {(rival.eliminatedYou || rival.youEliminatedThem) && (
        <ul className="rival-intro-panel__stakes">
          {rival.eliminatedYou && (
            <li className="rival-intro-panel__stake rival-intro-panel__stake--loss">
              They eliminated you earlier this run.
            </li>
          )}
          {rival.youEliminatedThem && (
            <li className="rival-intro-panel__stake rival-intro-panel__stake--win">
              You eliminated them earlier this run.
            </li>
          )}
        </ul>
      )}

      <p className="rival-intro-panel__note">
        Story only — no stat bonuses or hidden mechanics.
      </p>
    </section>
  )
}
