/**
 * 4-player online game simulation.
 * Run with: npx tsx scripts/simulate-online.ts
 *
 * Tests all phase transitions for a 4-player game (2 civilians, 1 undercover, 1 ghost).
 * Covers 3 win scenarios:
 *   Scenario A — civilians eliminate undercover in R1, then ghost in R2 → civilians win
 *   Scenario B — civilians eliminated first → undercover wins
 *   Scenario C — ghost eliminated first, guesses correctly → ghost wins
 */

import {
  createPlayer,
  createInitialGameState,
  startGame,
  submitClue,
  castVote,
  processGhostGuess,
  nextRound,
  checkWinCondition,
  eliminatePlayer,
} from "../lib/gameEngine";
import { DEFAULT_CONFIG, GameState } from "../lib/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` (${detail})` : ""}`);
    fail++;
  }
}

function makeState(safeRound = false): GameState {
  const players = [
    createPlayer("Alice", true),
    createPlayer("Bob"),
    createPlayer("Carol"),
    createPlayer("Dave"),
  ];
  const state = createInitialGameState("TEST01", {
    ...DEFAULT_CONFIG,
    safeRound,
    tieBreaker: true,
    undercoverCount: 1,
    ghostCount: 1,
  });
  return { ...state, players };
}

function givAllClues(state: GameState, prefix = "clue"): GameState {
  const active = state.players.filter((p) => !p.isEliminated);
  for (const p of active) {
    const result = submitClue(state, p.id, `${prefix}_${p.name}`);
    check(`${p.name} submitted clue`, !result.error, result.error);
    state = result.state;
  }
  return state;
}

function allVoteFor(state: GameState, targetId: string): GameState {
  const active = state.players.filter((p) => !p.isEliminated);
  for (const voter of active) {
    if (voter.id === targetId) continue; // target votes for someone else
    state = castVote(state, voter.id, targetId);
  }
  // target also votes (for first non-target active player)
  const target = state.players.find((p) => p.id === targetId)!;
  if (!target.hasVoted) {
    const other = state.players.find((p) => !p.isEliminated && p.id !== targetId)!;
    state = castVote(state, targetId, other.id);
  }
  return state;
}

// ─── Scenario A: civilians win (multi-round) ─────────────────────────────────
// R1: vote out ghost (wrong guess) → game continues
// R2: vote out undercover → civilians win

console.log("\n═══ Scenario A: Civilians Win (multi-round) ═══");
{
  let state = makeState();

  // Start
  state = startGame(state);
  check("Phase is role-reveal", state.phase === "role-reveal");
  check("Round is 1", state.round === 1);

  const roles = state.players.map((p) => p.role);
  const civCount = roles.filter((r) => r === "civilian").length;
  const ucCount = roles.filter((r) => r === "undercover").length;
  const ghostCount = roles.filter((r) => r === "ghost").length;
  check("Role counts correct (2 civ, 1 uc, 1 ghost)", civCount === 2 && ucCount === 1 && ghostCount === 1,
    `got civ=${civCount} uc=${ucCount} ghost=${ghostCount}`);
  check("Word pair assigned", !!state.wordPair);
  check("Civilian has civilian word", state.players.find(p => p.role === "civilian")?.word === state.wordPair?.civilian);
  check("Undercover has undercover word", state.players.find(p => p.role === "undercover")?.word === state.wordPair?.undercover);
  check("Ghost has no word", state.players.find(p => p.role === "ghost")?.word === null);

  // Advance to clue phase
  state = { ...state, phase: "clue" };

  // Round 1 — all give clues
  console.log("\n  [Round 1 — eliminate ghost, wrong guess]");
  state = givAllClues(state, "r1");
  check("Phase is discussion after all clued", state.phase === "discussion");
  check("All active players clued", state.players.filter(p => !p.isEliminated).every(p => p.clue !== null));

  // Vote out ghost
  const ghost = state.players.find((p) => p.role === "ghost")!;
  state = { ...state, phase: "vote" };
  state = allVoteFor(state, ghost.id);
  check("Phase is elimination", state.phase === "elimination");
  check("Ghost eliminated in R1", state.players.find(p => p.id === ghost.id)?.isEliminated);
  check("ghostGuessAllowed is true", state.ghostGuessAllowed);

  // Ghost guesses WRONG → game continues
  state = processGhostGuess(state, "completely_wrong_word");
  check("Phase is clue (R2) after wrong ghost guess", state.phase === "clue");
  check("Round is 2", state.round === 2);
  check("Clues reset for R2", state.players.every(p => p.clue === null));
  check("Win condition null (game continues)", checkWinCondition(state) === null);

  // Round 2 — 3 active: 2 civ + 1 uc (ghost gone)
  console.log("\n  [Round 2 — eliminate undercover → civilians win]");
  state = givAllClues(state, "r2");
  const undercover = state.players.find((p) => p.role === "undercover")!;
  state = { ...state, phase: "vote" };
  state = allVoteFor(state, undercover.id);
  check("Phase is elimination (undercover out)", state.phase === "elimination");
  check("ghostGuessAllowed is false (undercover eliminated)", !state.ghostGuessAllowed);

  // Continue → civilians win (no undercovers left)
  state = nextRound(state);
  check("Phase is summary", state.phase === "summary");
  check("Winner is civilians", state.winner === "civilians");
}

// ─── Scenario B: undercover wins ─────────────────────────────────────────────

console.log("\n═══ Scenario B: Undercover Wins ═══");
{
  let state = makeState();
  state = startGame(state);
  state = { ...state, phase: "clue" };

  const undercover = state.players.find((p) => p.role === "undercover")!;
  const ghost = state.players.find((p) => p.role === "ghost")!;
  const civilians = state.players.filter((p) => p.role === "civilian");

  // Round 1 — eliminate civilian 1
  console.log("\n  [Round 1 — eliminate a civilian]");
  state = givAllClues(state, "r1");
  state = { ...state, phase: "vote" };
  state = allVoteFor(state, civilians[0].id);
  check("Civilian eliminated in R1", state.phase === "elimination");
  check("No ghost guess (civilian eliminated)", !state.ghostGuessAllowed);

  // Active: 1 civ + 1 uc + 1 ghost = 3. uc(1) vs civ(1)+ghost(1) = 2 → not yet undercover win
  state = nextRound(state);
  check("Game continues (round 2)", state.phase === "clue");

  // Round 2 — eliminate ghost
  console.log("\n  [Round 2 — eliminate ghost]");
  state = givAllClues(state, "r2");
  state = { ...state, phase: "vote" };
  state = allVoteFor(state, ghost.id);
  // Active after: 1 civ, 1 uc → uc(1) >= civ(1) + ghost(0) = 1 → undercover wins
  // But we're in elimination phase now; nextRound will call checkWinCondition
  check("Ghost eliminated (phase=elimination)", state.phase === "elimination");

  // Ghost guesses wrong
  state = processGhostGuess(state, "completely_wrong");
  // After wrong ghost guess: checkWinCondition → 1 civ, 1 uc → uc wins
  check("Winner is undercover", state.winner === "undercover", `got ${state.winner}`);
  check("Phase is summary", state.phase === "summary");
}

// ─── Scenario C: ghost wins ───────────────────────────────────────────────────

console.log("\n═══ Scenario C: Ghost Wins ═══");
{
  let state = makeState();
  state = startGame(state);
  state = { ...state, phase: "clue" };

  const ghost = state.players.find((p) => p.role === "ghost")!;
  const civilianWord = state.wordPair!.civilian;

  // Round 1 — all give clues, then vote out ghost
  console.log("\n  [Round 1 — eliminate ghost]");
  state = givAllClues(state, "r1");
  state = { ...state, phase: "vote" };
  state = allVoteFor(state, ghost.id);
  check("Phase is elimination", state.phase === "elimination");
  check("ghostGuessAllowed is true", state.ghostGuessAllowed);
  check("Ghost correctly marked eliminated", state.players.find(p => p.id === ghost.id)?.isEliminated);

  // Ghost guesses CORRECTLY
  state = processGhostGuess(state, civilianWord);
  check("Winner is ghost", state.winner === "ghost", `got ${state.winner}`);
  check("Phase is summary", state.phase === "summary");
  check("ghostGuess stored", state.ghostGuess === civilianWord);
}

// ─── Scenario D: duplicate clue rejection ─────────────────────────────────────

console.log("\n═══ Scenario D: Duplicate Clue Rejected ═══");
{
  let state = makeState();
  state = startGame(state);
  state = { ...state, phase: "clue" };

  const [p1, p2] = state.players;

  // p1 gives a clue
  const r1 = submitClue(state, p1.id, "ocean");
  check("First player gives clue", !r1.error);
  state = r1.state;

  // p2 tries same clue
  const r2 = submitClue(state, p2.id, "ocean");
  check("Duplicate clue rejected", !!r2.error, r2.error ?? "no error returned");
  check("State unchanged after duplicate rejection", r2.state.players[1].clue === null);
}

// ─── Scenario E: tiebreaker flow ─────────────────────────────────────────────

console.log("\n═══ Scenario E: Tiebreaker ═══");
{
  let state = makeState();
  state = startGame(state);
  state = { ...state, phase: "clue" };

  // All give clues
  state = givAllClues(state, "r1");
  state = { ...state, phase: "vote" };

  // Force a 2-2 tie: p0+p1 vote for p2, p2+p3 vote for p0
  const [p0, p1, p2, p3] = state.players;
  state = castVote(state, p0.id, p2.id);
  state = castVote(state, p1.id, p2.id);
  state = castVote(state, p2.id, p0.id);
  state = castVote(state, p3.id, p0.id);

  check("Tie → tiebreaker clue phase", state.phase === "clue", `got phase=${state.phase}`);
  check("isTiebreaker flag set", state.isTiebreaker);

  // The 2 tied players re-clue
  const tiedIds = [p0.id, p2.id];
  for (const id of tiedIds) {
    const p = state.players.find(pl => pl.id === id)!;
    if (!p.isEliminated && !p.clue) {
      const result = submitClue(state, id, `tiebreak_${p.name}`);
      check(`${p.name} re-clued for tiebreaker`, !result.error);
      state = result.state;
    }
  }

  // Revote — everyone votes for p0 to break tie
  state = { ...state, phase: "vote" };
  state = allVoteFor(state, p0.id);
  check("Tiebreaker resolved → elimination", state.phase === "elimination", `got ${state.phase}`);
}

// ─── Scenario F: safe round (no elimination in R1) ────────────────────────────

console.log("\n═══ Scenario F: Safe Round ═══");
{
  let state = makeState(true); // safeRound = true
  state = startGame(state);
  state = { ...state, phase: "clue" };

  state = givAllClues(state, "r1");
  state = { ...state, phase: "vote" };

  // In safe round, host just continues — castVote still works but processVotes
  // is bypassed by the VotePhase UI. Test that nextRound from safe round
  // moves to round 2 without elimination.
  state = nextRound(state);
  check("Safe round: phase is clue in R2", state.phase === "clue");
  check("Safe round: no eliminations occurred", state.players.every(p => !p.isEliminated));
  check("Safe round: round is 2", state.round === 2);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(45)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error("\n⚠️  Some checks failed — review output above.");
  process.exit(1);
} else {
  console.log("\n🎉 All checks passed — online game engine is healthy.");
}
