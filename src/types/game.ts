// Versioned wire contract. Kept independently in each deployable repository.
export const API_VERSION = 'v1' as const;
export type Suit = '♥' | '♦' | '♣' | '♠';
export type Card = `${string}${Suit}`;
export type Role = 'real' | 'actor';
export type Phase = 'lobby' | 'turn' | 'swap' | 'question' | 'discussion' | 'vote' | 'revote' | 'finished';
export type Command =
  | { type: 'start' | 'continue' }
  | { type: 'play'; card: Card; target: string }
  | { type: 'offer'; card: Card }
  | { type: 'answer'; accused: string; reason: string }
  | { type: 'vote'; target: string };
export interface PublicPlayer { id: string; name: string; handCount: number; role?: Role; roleCard?: string }
export interface Event { at: number; text: string }
export interface Metrics { actions: Record<Suit, number>; inspections: number; blockedInspections: number; revotes: number }
export interface BallotRound { round: 1 | 2; votes: Record<string, string>; counts: Record<string, number> }
export interface Result { winner: Role; convicted: string[]; unresolvedTie: boolean; durationSeconds: number; metrics: Metrics; ballots: BallotRound[] }
export interface GameView {
  host: string; phase: Phase; round: number; active: string; players: PublicPlayer[];
  me: { id: string; role?: Role; roleCard?: string; hand: Card[]; intel: { target: string; role: Role; roleCard: string; round: number }[] };
  shields: string[]; seenThisRound: string[]; discard: Card[]; deckCount: number;
  pending?: { actor: string; target: string; offered: boolean };
  voted: boolean; voteCount: number; candidates: string[]; locked: string[];
  ballots: BallotRound[]; log: Event[]; discussionStartedAt?: number; result?: Result;
}
export interface Snapshot { apiVersion: typeof API_VERSION; code: string; revision: number; cleanupAt?: number; cleanupReason?: 'inactive' | 'not_enough_players'; game: GameView }
export interface Feedback { userId: string; fun: number; clarity: number; note: string }
export interface PlaytestReport { apiVersion: typeof API_VERSION; code: string; players: PublicPlayer[]; result: Result; log: Event[]; feedback: Feedback[] }
