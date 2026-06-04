# PlayHub — Feature Backlog

Per-game list of proposed new features. Each item is scoped for an agent to pick up and implement. Living doc — strike through or delete when shipped.

---

## WORDSPY

- [ ] **Clue Timer**
  Configurable 15/30/45s countdown per player during the clue phase. On expiry, auto-submit a placeholder clue ("…") and surface a toast. Add `clueTimerSeconds` to host config; reuse the existing realtime tick pattern so timers stay in sync across devices.

- [ ] **Complete Jury System**
  Wire up the jury flag that's already in `types.ts` / config. Eliminated players join a "jury" view; in the final round (or on Ghost reveal) they cast a single collective binding vote. Needs new sub-phase + UI for jury vote tally.

- [ ] **Custom Word Pairs**
  Host inputs their own civilian/undercover pair in lobby instead of picking a DB pack. Validate non-empty, no duplicates, max 30 chars. Store on `room.config.customPair` and skip pack selection when present.

- [ ] **Suspicion Tracker**
  Summary screen shows a per-round matrix of who voted for whom across all rounds. Pull from existing vote history; render as a compact grid with player avatars on both axes.

- [ ] **Clue Phase Reactions**
  Emoji reactions (😂🤔👀🔥) during the clue phase without opening chat. Reuse the existing reaction broadcast channel; show floating emoji over the reactor's name card for ~2s.

- [ ] **Enhanced Summary**
  Final summary clearly displays civilian word, undercover word, and who held each role (including Ghost). Currently the role mapping is implicit — make it explicit with role badges next to each player.

---

## MAFIA

- [ ] **New Role: Jester**
  Wins solo if the village votes them out during the day. Adds a third win condition the moderator/app must check after every day vote. Configurable on/off in lobby; only enabled with 8+ players.

- [ ] **New Role: Bodyguard**
  Village team. Each night picks one player to protect; if Mafia targets that player, Bodyguard dies instead. Cannot self-protect. Adds a night sub-phase between Doctor and Police.

- [ ] **New Role: Vigilante**
  Village team with one-shot night kill across the whole game. No Police investigation result generated for their kill. Surface remaining shot count in their role card.

- [ ] **Custom Mafia Count**
  Host overrides the auto-calc (`floor(players/4)`) with a manual 1–4 selector in lobby. Clamp upper bound to `floor(players/2) - 1` to keep the game playable.

- [ ] **Mafia Chat**
  Text-only chat visible to Mafia members during the `mafia-wake` sub-phase. Pass-phone only for now (single device passes between Mafia players); messages cleared at end of night.

- [ ] **Anonymous Voting**
  Hide vote attribution during the vote phase; only show tally totals. Reveal who voted for whom after elimination is locked in. Toggle in host config.

- [ ] **Graveyard Jury**
  Eliminated players spectate and cast one collective binding vote in the final round if villager count drops to parity. Mirrors the WordSpy jury system — share the implementation pattern.

- [ ] **Last Words**
  Eliminated player gets a 10s text input to write a farewell shown to everyone before the role reveal. Stored on the elimination record so it appears in the recap modal too.

- [ ] **Remote Multiplayer**
  Each player on their own device via Supabase Realtime, matching WordSpy's architecture. Replace pass-phone flow with private role views and night actions submitted server-side. Largest feature — likely needs its own design doc.

---

## DUMB CHARADES

- [ ] **Word Swap**
  Actor can swap their drawn word once per game for a fresh draw, no score penalty. Track usage per player (not per team). Show a "Swap (1 left)" button on the word-reveal screen.

- [ ] **Audience Steal**
  Other teams can buzz in during another team's acting turn. Correct guess steals half the points; wrong guess costs them a deduction. Needs a buzz button on idle teams' screens (pass-phone: rotate device or use multi-tap).

- [ ] **Custom Words**
  Host adds their own words/phrases at setup, merged into the selected category pool. Validate 1–40 chars, max 50 custom words per game. Persist to localStorage for re-use across sessions.

- [ ] **Sudden Death Tiebreaker**
  On tied scores after final round, tied teams get 30s each with one word; highest scorer wins outright. Use the hardest difficulty pool to keep stakes high.

- [ ] **Act Again Bonus**
  When the timer expires mid-attempt, teammates vote to extend by 15s. One use per team per game. Show a "Vote to extend" button to non-actor teammates during the last 10s.

- [ ] **Per-Round Score Breakdown**
  Game-over screen shows round-by-round score history per team, not just final totals. Add a collapsible scorecard table.

- [ ] **More Categories**
  Add packs: English Movies, Sports, Famous People, Anime, K-Drama. Match the existing pack shape in `wordPacks.ts`. Target 30+ entries per pack.

- [ ] **Random Actor Order**
  Toggle to shuffle the actor rotation instead of sequential. Avoids back-to-back same-actor when team sizes differ. Default off.

---

## PICTIONARY

- [ ] **Fill / Bucket Tool**
  Flood fill bounded regions with the active color using a stack-based scanline algorithm on the canvas ImageData. Add a paint bucket icon to the tool row; counts as one undo step.

- [ ] **Shape Tools**
  Line, circle, rectangle tools. Drag-to-draw with a live preview overlay; hold shift for perfect square/circle. Commit shape on mouse-up as a single stroke.

- [ ] **Extended Palette**
  Expand from 7 fixed colors to 16 + one custom HSV picker slot. Persist the custom color in localStorage so the user keeps their pick across rounds.

- [ ] **Drawing Replay**
  At round end, play back the drawing as a 5s timelapse. Requires storing stroke path data (points + color + size) instead of ImageData snapshots — bigger refactor, but unlocks export-as-video later.

- [ ] **Audience Steal**
  Other teams guess live during the drawing phase for steal points. Mirror the Dumb Charades version so they share UI components.

- [ ] **Eraser Size Control**
  Replace the forced 3×-brush eraser with its own 3-size selector matching the brush picker. Small but high-value polish.

- [ ] **Custom Words**
  Host adds their own words at setup, same as Dumb Charades. Share the input component between the two games.

- [ ] **Export Drawing**
  After round end, "Save PNG" button that downloads the final canvas. Filename includes round number and word for easy sharing.

---

## WAVELENGTH

- [ ] **Custom Spectrum Pairs**
  Host adds their own left/right pole pairs in lobby; merged with the selected pack. Validate non-empty, max 24 chars per pole. Persist to localStorage.

- [ ] **Clue Timer**
  Configurable 30/60/90s countdown for the psychic to type their clue. Auto-submit current input on expiry (even if empty — costs the round). Add to `GameConfig` alongside `guessTimerSeconds`.

- [ ] **Hard Mode**
  Narrow the bullseye/close zones (±3 / ±7 instead of ±5 / ±10). Toggle in host config; clearly indicate "Hard" on the spectrum during play.

- [ ] **Reaction Phase**
  After the reveal, a 5s window where all players can drop emoji reactions before the next round starts. Reuses the existing reaction system if available; otherwise add a minimal broadcast channel.

- [ ] **Solo / Cooperative Mode**
  Single team, no opposing team. Beat a target cumulative score (e.g. 30 points across 10 rounds). Useful for groups too small to split into two teams.

- [ ] **Round-by-Round Recap**
  Game-over screen lists each round: clue given, target position, needle position, points. Reuse the `history: RoundResult[]` already on `GameState`.

- [ ] **Psychic Streak Stats**
  Track per-player average score across all their psychic turns. Show on the game-over screen as "Best Psychic" / "Most Generous Clue Giver" awards.

---

## MINDFIELD

- [ ] **Custom Word Packs**
  Host adds 25 custom words in lobby instead of picking a pack. Validate length (1–20 chars each) and uniqueness. Persist to localStorage for re-use.

- [ ] **Pause / Resume**
  Spymaster can request a pause that halts the turn timer (when timers ship) and freezes input until the other spymaster confirms. Useful for IRL interruptions.

- [ ] **Turn Timer**
  Configurable timer for the spymaster's clue phase (1/2/3 min) and the guessing phase (30/60s per guess). On expiry, force-end the turn. Add to `GameConfig`.

- [ ] **Flagged Tile Reasons**
  Let agents attach a short note to a flagged tile ("clue 'animal' #2?") visible only to their own team. Build on existing `flaggedTiles: number[]` — extend to `{ tileId, note }`.

- [ ] **Clue History Sidebar**
  Persistent sidebar showing all `clueHistory` entries for the current round, with the clue, number, and which tiles were flipped on each. Currently only the latest clue is visible — full context speeds up deduction.

- [ ] **Spectator Mode**
  Players who join mid-game can spectate as a neutral observer with the spymaster view (sees all tile colors). Cannot give clues or guess. Add a `spectator` role to `PlayerRole`.

- [ ] **Daily Puzzle**
  Same seed across all players on a given day generates the same board. Solo or coop mode, no opponent team. Track best time / fewest clues on the leaderboard.

- [ ] **Round Recap Replay**
  At round end, animate the sequence of clues + flipped tiles for the round so players can review what happened. Pull from `clueHistory` + reveal order.

- [ ] **Sound Pack Toggle**
  Existing `sound.ts` plays effects; let host pick between subtle / arcade / off in lobby config.
