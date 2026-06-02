import type { MatchIntroductionSnapshot } from '../types/scouting'

import { ActiveArenaDraftsPanel } from './ActiveArenaDraftsPanel'

import { ArenaPhaseBanner } from './ArenaPhaseBanner'

import { ClassInfoBadge } from './ClassInfoBadge'

import { RivalBadge } from './RivalBadge'

import { RivalIntroPanel } from './RivalIntroPanel'



interface MatchIntroductionScreenProps {

  introduction: MatchIntroductionSnapshot

  activePlayersRemaining: number

  onBeginCombat: () => void

  onLeave: () => void

}



export function MatchIntroductionScreen({

  introduction,

  activePlayersRemaining,

  onBeginCombat,

  onLeave,

}: MatchIntroductionScreenProps) {

  const { you, opponent, arenaPhase, arenaPhaseLabel, scouting, rival } =

    introduction



  return (

    <section className="screen match-intro-screen" data-testid="match-intro-screen">

      <header className="match-intro-screen__header">

        <p className="match-intro-screen__eyebrow">Match introduction</p>

        {rival?.isRivalMatch && <RivalBadge />}

        <h2>

          {you.championName} <span className="match-intro-screen__vs">vs</span>{' '}

          {opponent.championName}

        </h2>

        <p className="match-intro-screen__phase">

          Arena phase: <strong>{arenaPhaseLabel}</strong>

        </p>

      </header>



      {rival?.isRivalMatch && (

        <RivalIntroPanel

          rival={rival}

          yourName={you.championName}

          opponentDisplayTitle={opponent.displayTitle}

        />

      )}



      <ArenaPhaseBanner

        phase={arenaPhase}

        activePlayersRemaining={activePlayersRemaining}

        finalDuelSeriesLabel={introduction.finalDuelSeriesLabel}

        compact

      />



      <div className="match-intro-fighters">

        <article className="match-intro-fighter match-intro-fighter--you">

          <span className="match-intro-fighter__role">You</span>

          <strong className="match-intro-fighter__name">{you.championName}</strong>

          <ClassInfoBadge

            classId={you.classId}

            evolutionId={you.evolutionId}

            compact

          />

          <p className="match-intro-fighter__hp">

            HP <strong>{you.hp}</strong>

            <span className="match-intro-fighter__hp-max"> / {you.maxHp}</span>

          </p>

        </article>



        <div className="match-intro-fighters__divider" aria-hidden>

          VS

        </div>



        <article className="match-intro-fighter match-intro-fighter--opponent">

          <span className="match-intro-fighter__role">

            {rival?.isRivalMatch ? 'Rival' : 'Opponent'}

          </span>

          <strong className="match-intro-fighter__name">

            {opponent.championName}

          </strong>

          <ClassInfoBadge

            classId={opponent.classId}

            evolutionId={opponent.evolutionId}

            compact

          />

          <p className="match-intro-fighter__hp">

            HP <strong>{opponent.hp}</strong>

            <span className="match-intro-fighter__hp-max"> / {opponent.maxHp}</span>

          </p>

        </article>

      </div>



      <section className="scouting-panel" aria-labelledby="scouting-panel-title">

        <header className="scouting-panel__header">

          <h3 id="scouting-panel-title">Scouting report</h3>

          <p className="scouting-panel__subtitle">

            Intelligence only — no gameplay bonuses.

          </p>

        </header>



        <div className="scouting-panel__grid">

          <div className="scouting-panel__facts">

            <h4>Opponent overview</h4>

            <dl className="scouting-facts">

              <div className="scouting-facts__row">

                <dt>Class</dt>

                <dd>{scouting.baseClassName}</dd>

              </div>

              <div className="scouting-facts__row">

                <dt>Evolved class</dt>

                <dd>

                  {scouting.evolutionName ?? (

                    <span className="scouting-facts__unknown">Not evolved yet</span>

                  )}

                </dd>

              </div>

              <div className="scouting-facts__row">

                <dt>Starting HP</dt>

                <dd>{scouting.startingHp}</dd>

              </div>

              <div className="scouting-facts__row">

                <dt>Deck size</dt>

                <dd>{scouting.deckSize} cards</dd>

              </div>

              <div className="scouting-facts__row">

                <dt>Arena lives</dt>

                <dd>{scouting.arenaLivesRemaining}</dd>

              </div>

              <div className="scouting-facts__row">

                <dt>Wins this run</dt>

                <dd>{scouting.winCount}</dd>

              </div>

              {rival?.isRivalMatch && (

                <div className="scouting-facts__row scouting-facts__row--rival">

                  <dt>Rival record</dt>

                  <dd>{rival.recordLine}</dd>

                </div>

              )}

            </dl>

          </div>



          <div className="scouting-panel__cards">

            <h4>Top played cards</h4>

            {scouting.topPlayedCards.length === 0 ? (

              <p className="scouting-panel__empty">

                No card history yet — first match against this fighter.

              </p>

            ) : (

              <ol className="scouting-top-cards">

                {scouting.topPlayedCards.map((card, index) => (

                  <li key={card.cardId} className="scouting-top-cards__item">

                    <span className="scouting-top-cards__rank">#{index + 1}</span>

                    <strong>{card.cardName}</strong>

                    <span className="scouting-top-cards__count">

                      {card.timesPlayed}× played

                    </span>

                  </li>

                ))}

              </ol>

            )}

          </div>

        </div>



        <ActiveArenaDraftsPanel

          activeDraftIds={scouting.activeArenaDraftIds}

          title="Active arena draft modifiers"

          compact

        />



        <aside className="scouting-panel__career" aria-label="Opponent career stats">

          <h4>Career stats (this lobby)</h4>

          <ul className="scouting-career-stats">

            <li>

              <span>Matches won</span>

              <strong>{scouting.careerStats.matchesWon}</strong>

            </li>

            <li>

              <span>Damage dealt</span>

              <strong>{scouting.careerStats.damageDealt}</strong>

            </li>

            <li>

              <span>Damage taken</span>

              <strong>{scouting.careerStats.damageTaken}</strong>

            </li>

            <li>

              <span>Cards played</span>

              <strong>{scouting.careerStats.cardsPlayed}</strong>

            </li>

          </ul>

        </aside>



        <p className="scouting-panel__disclaimer">

          Deck contents, hand, and future rewards are not revealed.

        </p>

      </section>



      <div className="match-intro-screen__actions">

        <button

          type="button"

          className="primary-button match-intro-screen__begin"

          data-testid="begin-combat-button"

          onClick={onBeginCombat}

        >

          Begin combat

        </button>

        <button type="button" className="secondary-button" onClick={onLeave}>

          Back to lobby

        </button>

      </div>

    </section>

  )

}


