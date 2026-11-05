import type { Card, GameView } from '../types/game';
export function canChoosePlayer(g: GameView, card: Card | undefined, id: string): boolean {
  if (!g.players.some(p => p.id === id)) return false;
  if (g.phase === 'turn') {
    if (g.active !== g.me.id || !card || !g.me.hand.includes(card)) return false;
    const suit = card.slice(-1);
    if (suit === '♦' || suit === '♣') return id !== g.me.id;
    if (suit === '♥') return !g.shields.includes(id) && !g.seenThisRound.includes(id);
    return true;
  }
  if (g.phase === 'question') return g.pending?.target === g.me.id && id !== g.me.id;
  if (g.phase === 'vote' || g.phase === 'revote') return !g.voted && (g.phase !== 'revote' || g.candidates.includes(id));
  return false;
}
