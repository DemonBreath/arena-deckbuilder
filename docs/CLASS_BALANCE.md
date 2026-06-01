# Class Balance Reference (Milestone 20)

Baseline PvP stats: **30 HP**, **3 energy**, **5 cards drawn** per turn.

Design rules:
- Higher HP → weaker offense / passives
- Higher damage → lower HP / defense
- Economy (Merchant) → weaker combat deck
- No passive should exceed ~**one card worth** of value every turn
- Starter decks use only PvP-legal cards: Strike, Guard, Strike+, Guard+, Heavy Strike

Role labels (UI): **Tank · Aggro · Combo · Control · Sustain · Economy · Utility**

---

## Guardian
| Field | Value |
|-------|-------|
| Role | Tank |
| Difficulty | Easy |
| HP | 38 (+8) |
| Energy | 3 |
| Passive | **Fortify** — +8 Max HP. Start each turn with 1 Block. |
| Deck style | Defensive (6 Guard, 2 Guard+, 2 Strike) |
| Strength | High HP and steady block each turn. |
| Weakness | Low damage output; struggles to close fights quickly. |

---

## Berserker
| Field | Value |
|-------|-------|
| Role | Aggro |
| Difficulty | Hard |
| HP | 24 (−6) |
| Energy | 3 |
| Passive | **Bloodlust** — Strike and Heavy Strike deal +2 damage. |
| Deck style | Aggressive (6 attacks, 2 Heavy, 2 Guard) |
| Strength | High burst damage on core attack cards. |
| Weakness | Fragile HP; punished if fights drag on. |

---

## Gunslinger
| Field | Value |
|-------|-------|
| Role | Combo |
| Difficulty | Medium |
| HP | 28 (−2) |
| Energy | 3 |
| Passive | **Combo Shot** — Second Strike each turn deals +2 bonus damage. |
| Deck style | Combo chains (5 Strike, 2 Strike+, 3 Guard) |
| Strength | Strong multi-Strike turns with lean deck. |
| Weakness | Average HP; weak if Strikes are blocked. |

---

## Necromancer
| Field | Value |
|-------|-------|
| Role | Sustain |
| Difficulty | Medium |
| HP | 26 (−4) |
| Energy | 3 |
| Passive | **Life Drain** — Heal 1 HP when you play a Guard card. |
| Deck style | Sustain mix (4 Guard, 2 Guard+, 4 attacks) |
| Strength | Healing while defending extends fights. |
| Weakness | Lower HP; heal costs a turn playing Guard. |

---

## Pyromancer
| Field | Value |
|-------|-------|
| Role | Aggro |
| Difficulty | Hard |
| HP | 26 (−4) |
| Energy | 3 |
| Passive | **Scorch** — +1 damage on all attack cards. |
| Deck style | Aggressive (6 attacks, 2 Heavy, 2 Guard) |
| Strength | Consistent attack pressure. |
| Weakness | Thin defenses; vulnerable to burst. |

---

## Cryomancer
| Field | Value |
|-------|-------|
| Role | Control |
| Difficulty | Medium |
| HP | 32 (+2) |
| Energy | 3 |
| Passive | **Ice Armor** — Start each turn with 1 Block. |
| Deck style | Defensive control (5 Guard, 2 Guard+, 3 attacks) |
| Strength | Stalls opponents with block and HP. |
| Weakness | Low kill pressure vs burst classes. |

---

## Paladin
| Field | Value |
|-------|-------|
| Role | Sustain |
| Difficulty | Easy |
| HP | 34 (+4) |
| Energy | 3 |
| Passive | **Aegis** — Start each turn with 1 Block. Heal 1 HP when playing Guard. |
| Deck style | Defensive sustain (5 Guard, 2 Guard+, 3 attacks) |
| Strength | Reliable defense and chip healing. |
| Weakness | Slow damage; weak vs economy snowball. |

---

## Assassin
| Field | Value |
|-------|-------|
| Role | Aggro |
| Difficulty | Hard |
| HP | 28 (−2) |
| Energy | 3 |
| Passive | **Opening Strike** — First attack each turn deals +2 bonus damage. |
| Deck style | Burst aggressive (6 attacks, 1 Heavy, 3 Guard) |
| Strength | Strong openers every turn. |
| Weakness | Follow-up attacks weaker; needs timing. |

---

## Alchemist
| Field | Value |
|-------|-------|
| Role | Utility |
| Difficulty | Medium |
| HP | 30 |
| Energy | 3 |
| Passive | **Volatile Brew** — Attack cards in even hand slots deal +1 damage. |
| Deck style | Balanced utility (5 attack, 5 guard mix) |
| Strength | Flexible deck with situational damage bumps. |
| Weakness | Inconsistent passive; no standout stat line. |

---

## Timekeeper
| Field | Value |
|-------|-------|
| Role | Control |
| Difficulty | Hard |
| HP | 28 (−2) |
| Energy | 3 |
| Passive | **Borrowed Moment** — +2 Energy on the first turn of each battle only. |
| Deck style | Balanced tempo (4 Strike, 3 Guard, upgrades) |
| Strength | Powerful first-turn plays. |
| Weakness | Average HP; weaker after opening spike. |

---

## Merchant
| Field | Value |
|-------|-------|
| Role | Economy |
| Difficulty | Easy |
| HP | 26 (−4) |
| Energy | 3 |
| Passive | **Barter** — +30 starting gold. 15% off shop card prices. |
| Deck style | Defensive economy (8 Guard, 2 Strike) |
| Strength | Gold lead and cheaper shop upgrades. |
| Weakness | Weak combat deck; loses direct fights early. |

---

## Vampire
| Field | Value |
|-------|-------|
| Role | Sustain |
| Difficulty | Medium |
| HP | 28 (−2) |
| Energy | 3 |
| Passive | **Blood Siphon** — Heal 1 HP when an attack deals damage. |
| Deck style | Sustain mix (3 Guard, 2 Guard+, 5 attacks) |
| Strength | Grinds opponents with chip heal on hits. |
| Weakness | Needs to land attacks; weak vs heavy block. |

---

## M20 balance changes (summary)

| Class | Change |
|-------|--------|
| Guardian | HP +10→+8, block 2→1 per turn, deck more defensive |
| Gunslinger | Removed +1 energy; combo +3→+2; HP 30→28 |
| Timekeeper | Replaced +1 draw/turn with +2 energy turn 1 only |
| Assassin | First-attack bonus +4→+2 |
| Necromancer | Guard heal +2→+1 |
| Paladin | HP +6→+4 |
| Cryomancer | HP +4→+2 |
| Merchant | Gold +40→+30, discount 20%→15%, 8-guard deck |
| All | Standardized role labels; decks tuned to archetype |

---

## Testing

### Class selection (compare UI)
1. Title → **Choose Class & Start Solo** (or Join Lobby).
2. Toggle **Compare all** — click rows to select; check HP, energy, deck, passive, difficulty.
3. Toggle **Class detail** — picker + full panel with strengths/weaknesses.

### Class Test Lab (dev)
1. Run `npm run dev` or open `?classtest` on deploy preview.
2. Title → **Class Test Lab** → pick class → **Start Test Battle**.
3. Fight Training Dummy (28 HP); use **Reset Test** between tries.

### PvP readability
1. Two-tab lobby — each picks a class.
2. Lobby roster shows class name + role; hover for passive tooltip.
3. In PvP battle, both fighter panels show class badge + passive description.

---

## Adding class #13 later

1. Add id to `ClassId` in `src/game/classDatabase.ts`.
2. Append `CLASS_REGISTRY` entry (role, difficulty, deckStyle, stats, deck, passiveKind).
3. Implement `passiveKind` in `src/game/classPassives.ts`.
4. Add row to this document.
5. UI and comparison table update automatically via registry helpers.
