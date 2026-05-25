import { createServerClient } from "../supabase";
import type {
  GameState, Player, Tile, ClueEntry, RoundRecord, GameConfig,
} from "@/games/mindfield/types";

// ── Row shapes ────────────────────────────────────────────────────────────────

interface GSRow { id: string; room_id: string; phase: string; round: number; updated_at: string; }
interface RoomRow { id: string; code: string; settings: Record<string, unknown>; }
interface PlayerRow { id: string; room_id: string; player_name: string; is_host: boolean; role: string | null; team: string | null; joined_at: string; }
interface RoundRow {
  id: string; room_id: string; round_number: number;
  current_team: string; turn_phase: string;
  clue: string | null; clue_number: number | null; guesses_remaining: number;
  big_clue_used_red: boolean; big_clue_used_blue: boolean;
  round_winner: string | null; bomb_triggered_by: string | null;
}
interface TileRow { id: string; round_id: string; position: number; word: string; color: string; revealed: boolean; revealed_at: string | null; flagged: boolean; }
interface ClueRow { id: string; round_id: string; sequence: number; team: string; spymaster_name: string; word: string; count: number; }
interface ResultRow { room_id: string; round_number: number; winner: string; bomb_triggered: boolean; bomb_triggered_by: string | null; winner_used_big_clue: boolean; red_points_earned: number; blue_points_earned: number; }

export interface MFStateRow { state: GameState; room_id: string; updated_at: string; }

// ── Assembly ──────────────────────────────────────────────────────────────────

async function assemble(
  db: ReturnType<typeof createServerClient>,
  gs: GSRow,
  room: RoomRow,
): Promise<MFStateRow> {
  const [playersRes, roundRes, resultsRes] = await Promise.all([
    db.from("room_players").select("*").eq("room_id", gs.room_id).order("joined_at"),
    db.from("mf_rounds").select("*").eq("room_id", gs.room_id).order("round_number", { ascending: false }).limit(1).maybeSingle(),
    db.from("mf_round_results").select("*").eq("room_id", gs.room_id).order("round_number"),
  ]);

  const players: Player[] = ((playersRes.data ?? []) as PlayerRow[]).map(p => ({
    id: p.id,
    name: p.player_name,
    team: (p.team as Player["team"]) ?? null,
    role: (p.role as Player["role"]) ?? null,
    isHost: p.is_host,
    joinedAt: new Date(p.joined_at).getTime(),
  }));

  const roundHistory: RoundRecord[] = ((resultsRes.data ?? []) as ResultRow[]).map(r => ({
    round: r.round_number,
    winner: r.winner as "red" | "blue",
    bombTriggered: r.bomb_triggered,
    bombTriggeredBy: r.bomb_triggered_by as "red" | "blue" | null,
    winnerUsedBigClue: r.winner_used_big_clue,
    redPointsEarned: r.red_points_earned,
    bluePointsEarned: r.blue_points_earned,
  }));

  const redWins   = roundHistory.filter(r => r.winner === "red").length;
  const blueWins  = roundHistory.filter(r => r.winner === "blue").length;
  const redPoints = roundHistory.reduce((s, r) => s + r.redPointsEarned, 0);
  const bluePoints = roundHistory.reduce((s, r) => s + r.bluePointsEarned, 0);

  const config = (room.settings as unknown as GameConfig) ?? { packId: "", targetWins: 3 };
  const targetWins = config.targetWins ?? 3;
  const winner = redWins >= targetWins ? "red" : blueWins >= targetWins ? "blue" : null;

  let tiles: Tile[] = [];
  let clueHistory: ClueEntry[] = [];
  let currentTeam: GameState["currentTeam"] = "red";
  let turnPhase:   GameState["turnPhase"]   = "giving-clue";
  let clue: string | null = null;
  let clueNumber: number | null = null;
  let guessesRemaining = 0;
  let bigClueUsedRed = false;
  let bigClueUsedBlue = false;
  let roundWinner: GameState["roundWinner"] = null;
  let bombTriggeredBy: GameState["bombTriggeredBy"] = null;
  let flaggedTiles: number[] = [];

  const roundRow = roundRes.data as RoundRow | null;
  if (roundRow) {
    currentTeam    = roundRow.current_team as GameState["currentTeam"];
    turnPhase      = roundRow.turn_phase as GameState["turnPhase"];
    clue           = roundRow.clue;
    clueNumber     = roundRow.clue_number;
    guessesRemaining = roundRow.guesses_remaining;
    bigClueUsedRed  = roundRow.big_clue_used_red;
    bigClueUsedBlue = roundRow.big_clue_used_blue;
    roundWinner    = roundRow.round_winner as GameState["roundWinner"];
    bombTriggeredBy = roundRow.bomb_triggered_by as GameState["bombTriggeredBy"];

    const [tilesRes, cluesRes] = await Promise.all([
      db.from("mf_tiles").select("*").eq("round_id", roundRow.id).order("position"),
      db.from("mf_clues").select("*").eq("round_id", roundRow.id).order("sequence"),
    ]);

    tiles = ((tilesRes.data ?? []) as TileRow[]).map(t => ({
      id: t.position,
      word: t.word,
      color: t.color as Tile["color"],
      revealed: t.revealed,
    }));

    flaggedTiles = ((tilesRes.data ?? []) as TileRow[]).filter(t => t.flagged).map(t => t.position);

    clueHistory = ((cluesRes.data ?? []) as ClueRow[]).map(c => ({
      team: c.team as "red" | "blue",
      spymasterName: c.spymaster_name,
      clue: c.word,
      clueNumber: c.count,
      round: gs.round,
    }));
  }

  const state: GameState = {
    roomCode: room.code,
    phase: gs.phase as GameState["phase"],
    players,
    config,
    tiles,
    currentTeam,
    turnPhase,
    clue,
    clueNumber,
    guessesRemaining,
    bigClueUsedRed,
    bigClueUsedBlue,
    roundWinner,
    bombTriggeredBy,
    redWins,
    blueWins,
    redPoints,
    bluePoints,
    winner,
    flaggedTiles,
    clueHistory,
    roundHistory,
    round: gs.round,
    createdAt: 0,
    version: new Date(gs.updated_at).getTime(),
  };

  return { state, room_id: gs.room_id, updated_at: gs.updated_at };
}

// ── Meta (lightweight — for version checks) ───────────────────────────────────

export async function getMFMeta(roomId: string): Promise<{ updated_at: string; phase: string } | null> {
  const db = createServerClient();
  const { data } = await db.from("game_state").select("updated_at,phase").eq("room_id", roomId).maybeSingle();
  return data as { updated_at: string; phase: string } | null;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getMFState(roomId: string): Promise<MFStateRow | null> {
  const db = createServerClient();
  const [gsRes, roomRes] = await Promise.all([
    db.from("game_state").select("id,room_id,phase,round,updated_at").eq("room_id", roomId).maybeSingle(),
    db.from("rooms").select("id,code,settings").eq("id", roomId).maybeSingle(),
  ]);
  if (!gsRes.data || !roomRes.data) return null;
  return assemble(db, gsRes.data as GSRow, roomRes.data as RoomRow);
}

export async function getMFStateByCode(roomCode: string): Promise<MFStateRow | null> {
  const db = createServerClient();
  const roomRes = await db.from("rooms").select("id,code,settings").eq("code", roomCode).maybeSingle();
  if (!roomRes.data) return null;
  const gsRes = await db.from("game_state").select("id,room_id,phase,round,updated_at").eq("room_id", roomRes.data.id).maybeSingle();
  if (!gsRes.data) return null;
  return assemble(db, gsRes.data as GSRow, roomRes.data as RoomRow);
}

// ── Write: room creation ──────────────────────────────────────────────────────

export async function insertMFState(roomId: string): Promise<void> {
  const db = createServerClient();
  const { error } = await db.from("game_state").insert({
    room_id: roomId,
    phase: "lobby",
    round: 0,
  });
  if (error) throw new Error(`insertMFState: ${error.message}`);
}

// ── Write: start / next round ─────────────────────────────────────────────────

export async function insertMFRound(
  roomId: string,
  roundNumber: number,
  tiles: Tile[],
): Promise<string> {
  const db = createServerClient();

  const { data: roundData, error: roundErr } = await db
    .from("mf_rounds")
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      current_team: "red",
      turn_phase: "giving-clue",
      guesses_remaining: 0,
    })
    .select("id")
    .single();
  if (roundErr) throw new Error(`insertMFRound: ${roundErr.message}`);

  const roundId = roundData.id as string;

  const { error: tilesErr } = await db.from("mf_tiles").insert(
    tiles.map(t => ({
      round_id: roundId,
      position: t.id,
      word: t.word,
      color: t.color,
    }))
  );
  if (tilesErr) throw new Error(`insertMFRound tiles: ${tilesErr.message}`);

  await db.from("game_state")
    .update({ phase: "playing", round: roundNumber })
    .eq("room_id", roomId);

  return roundId;
}

// ── Write: tile reveal (atomic) ───────────────────────────────────────────────

export async function revealMFTile(
  roundId: string,
  position: number,
): Promise<TileRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("mf_tiles")
    .update({ revealed: true, revealed_at: new Date().toISOString() })
    .eq("round_id", roundId)
    .eq("position", position)
    .eq("revealed", false)
    .select()
    .maybeSingle();
  if (error) throw new Error(`revealMFTile: ${error.message}`);
  return data as TileRow | null;
}

// ── Write: general state update (lobby + in-game turn state) ─────────────────

export async function updateMFState(roomId: string, state: GameState): Promise<void> {
  const db = createServerClient();

  // 1. Update game_state phase + round
  await db.from("game_state")
    .update({ phase: state.phase, round: state.round })
    .eq("room_id", roomId);

  // 2. Upsert room_players — active players only; delete removed ones
  if (state.players.length > 0) {
    const upsertRows = state.players.map(p => ({
      id: p.id,
      room_id: roomId,
      player_name: p.name,
      is_host: p.isHost,
      team: p.team ?? null,
      role: p.role ?? null,
    }));
    await db.from("room_players").upsert(upsertRows, { onConflict: "id" });
    // Remove players no longer in state (kicked/left)
    await db.from("room_players")
      .delete()
      .eq("room_id", roomId)
      .not("id", "in", `(${state.players.map(p => p.id).join(",")})`);
  } else {
    // play-again reset: clear team/role on all players, keep them in room
    await db.from("room_players")
      .update({ team: null, role: null })
      .eq("room_id", roomId);
  }

  // 3. Update rooms.settings for config changes
  await db.from("rooms").update({ settings: state.config as unknown as Record<string, unknown> }).eq("id", roomId);

  // 4. If there's an active round, update turn state + tiles flagged
  if (state.phase === "playing" || state.phase === "round-over" || state.phase === "game-over") {
    const { data: roundRow } = await db
      .from("mf_rounds")
      .select("id,round_number")
      .eq("room_id", roomId)
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (roundRow) {
      const rid = roundRow.id as string;

      // Update round turn state
      await db.from("mf_rounds").update({
        current_team:       state.currentTeam,
        turn_phase:         state.turnPhase,
        clue:               state.clue,
        clue_number:        state.clueNumber,
        guesses_remaining:  state.guessesRemaining,
        big_clue_used_red:  state.bigClueUsedRed,
        big_clue_used_blue: state.bigClueUsedBlue,
        round_winner:       state.roundWinner,
        bomb_triggered_by:  state.bombTriggeredBy,
      }).eq("id", rid);

      // Update flagged tiles
      if (state.tiles.length > 0) {
        const flagged = new Set(state.flaggedTiles ?? []);
        await Promise.all(
          state.tiles.map(t =>
            db.from("mf_tiles")
              .update({ flagged: flagged.has(t.id) })
              .eq("round_id", rid)
              .eq("position", t.id)
          )
        );
      }

      // Sync new clues (append-only — insert any beyond what's already stored)
      const { count: existingCount } = await db
        .from("mf_clues")
        .select("*", { count: "exact", head: true })
        .eq("round_id", rid);
      const stored = existingCount ?? 0;
      if (state.clueHistory.length > stored) {
        const newClues = state.clueHistory.slice(stored);
        await db.from("mf_clues").insert(
          newClues.map((c, i) => ({
            round_id:       rid,
            sequence:       stored + i,
            team:           c.team,
            spymaster_name: c.spymasterName,
            word:           c.clue,
            count:          c.clueNumber,
          }))
        );
      }

      // If round just ended, save the result
      if ((state.phase === "round-over" || state.phase === "game-over") && state.roundHistory.length > 0) {
        const last = state.roundHistory[state.roundHistory.length - 1];
        await db.from("mf_round_results").upsert({
          room_id:             roomId,
          round_number:        last.round,
          winner:              last.winner,
          bomb_triggered:      last.bombTriggered,
          bomb_triggered_by:   last.bombTriggeredBy,
          winner_used_big_clue: last.winnerUsedBigClue,
          red_points_earned:   last.redPointsEarned,
          blue_points_earned:  last.bluePointsEarned,
        }, { onConflict: "room_id,round_number" });
      }
    }
  }
}
