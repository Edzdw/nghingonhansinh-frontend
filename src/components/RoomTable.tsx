'use client';
import type { CSSProperties } from 'react';
import type { Card, GameView } from '@/types/game';
import { canChoosePlayer, seatedPlayers, seatPosition } from '@/lib/table';
const ACTIONS: Record<string, string> = { '♥': 'CHE CHẮN', '♦': 'SOI KÍN', '♣': 'ĐỔI BÀI', '♠': 'CHẤT VẤN' };
export default function RoomTable({ game: g, card, target, onTarget, busy = false }: { game: GameView; card?: Card; target: string; onTarget: (id: string) => void; busy?: boolean }) {
  const players = seatedPlayers(g);
  const name = (id: string) => g.players.find(p => p.id === id)?.name || '?';
  const positions = new Map(players.map((p, i) => [p.id, seatPosition(i, players.length)]));
  const actor = g.pending?.actor || (g.phase === 'turn' ? g.active : undefined);
  const recipient = g.pending?.target || (canChoosePlayer(g, card, target) ? target : undefined);
  const from = actor && positions.get(actor), to = recipient && positions.get(recipient);
  const choosing = g.players.some(p => canChoosePlayer(g, card, p.id));
  let headline = 'Chờ hội bạn vào bàn';
  let detail = `${g.players.length}/8 người · Cần ít nhất 4 người`;
  if (g.phase === 'turn') { headline = g.active === g.me.id ? 'Đến lượt bạn' : `${name(g.active)} đang hành động`; detail = card && g.active === g.me.id ? `${ACTIONS[card.slice(-1)]} · Chọn một người trên bàn` : 'Rút 1 lá · Đánh 1 lá · Giữ 2 lá'; }
  if (g.phase === 'swap') { headline = 'Trao đổi kín'; detail = `${name(g.pending!.actor)} ↔ ${name(g.pending!.target)}`; }
  if (g.phase === 'question') { headline = `${name(g.pending!.target)} đang trả lời`; detail = `${name(g.pending!.actor)} → CHẤT VẤN`; }
  if (g.phase === 'discussion') { headline = 'Tin ai bây giờ?'; detail = 'Cả bàn thảo luận · Chờ chủ phòng chuyển tiếp'; }
  if (g.phase === 'vote' || g.phase === 'revote') { headline = g.phase === 'revote' ? 'Bỏ phiếu lại' : 'Ai đang diễn?'; detail = `${g.voteCount}/${g.players.length} phiếu đã khóa${g.voted ? ' · Bạn đã bỏ phiếu' : ''}`; }
  if (g.phase === 'finished') { headline = `${g.result?.winner === 'real' ? 'Người Thật' : 'Kẻ Diễn'} thắng`; detail = g.result?.unresolvedTie ? 'Vẫn đồng phiếu ở ranh giới' : 'Sự thật đã được mở ra'; }
  return <section className="table-scene" aria-label="Bàn chơi và người chơi">
    <div className="table-topline"><span>AI ĐANG DIỄN?</span><div className="round-lights" aria-label={`Vòng ${g.round} trên 3`}>{[1, 2, 3].map(n => <span key={n} className={g.round >= n ? 'lit' : ''}>{n}</span>)}</div><span>{g.players.length} NGƯỜI</span></div>
    <div className={`poker-stage ${choosing ? 'choosing' : ''}`}>
      <div className="table-rail"><div className="table-felt"><span className="felt-brand" aria-hidden="true">NNNS</span></div></div>
      {from && to && actor !== recipient && <svg className="interaction-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="interaction-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs><path d={`M ${from.x} ${from.y} Q 50 50 ${to.x} ${to.y}`} markerEnd="url(#interaction-arrow)"/></svg>}
      <div className="table-center" aria-live="polite"><p className="table-kicker">{g.phase === 'lobby' ? 'BÀN ĐANG MỞ' : `VÒNG ${g.round} / 3`}</p><h2>{headline}</h2><p className="table-detail">{detail}</p>
        {g.phase !== 'lobby' && <div className="table-piles"><div className="pile"><span className="deck-back">?</span><small>RÚT · {g.deckCount}</small></div><span className="pile-divider">/</span><div className="pile"><span className={`discard-face ${/[♥♦]/.test(g.discard.at(-1) || '') ? 'red' : ''}`}>{g.discard.at(-1) || '—'}</span><small>BỎ · {g.discard.length}</small></div></div>}
        {recipient && <p className="target-preview">{g.pending ? 'Đang tương tác' : 'Đã chọn'} <b>{name(recipient)}</b></p>}
      </div>
      {players.map((p, i) => {
        const pos = positions.get(p.id)!; const mine = p.id === g.me.id;
        const acting = (g.phase === 'turn' && p.id === g.active) || (g.phase === 'question' && p.id === g.pending?.target);
        const participant = (g.phase === 'swap' || g.phase === 'question') && (p.id === g.pending?.actor || p.id === g.pending?.target);
        const eligible = canChoosePlayer(g, card, p.id), selected = eligible && target === p.id;
        const status = acting ? g.phase === 'question' ? 'ĐANG TRẢ LỜI' : 'ĐANG HÀNH ĐỘNG' : selected ? 'ĐÃ CHỌN MỤC TIÊU' : g.phase === 'swap' && participant ? 'ĐANG ĐỔI BÀI' : p.id === g.host ? 'CHỦ PHÒNG' : mine ? 'GHẾ CỦA BẠN' : `GHẾ ${g.players.findIndex(x => x.id === p.id) + 1}`;
        return <div key={p.id} className={`table-seat ${mine ? 'my-seat' : ''} ${acting ? 'acting' : ''} ${participant ? 'interacting' : ''} ${selected ? 'targeted' : ''}`} style={{ '--seat-x': `${pos.x}%`, '--seat-y': `${pos.y}%` } as CSSProperties}>
          <button type="button" className={`seat-button ${eligible && !busy ? 'eligible' : ''}`} disabled={!eligible || busy} onClick={() => onTarget(p.id)} aria-pressed={selected} aria-label={`${p.name}${mine ? ', bạn' : ''}, ${acting ? 'đang hành động, ' : ''}${eligible ? 'chọn làm mục tiêu' : 'người chơi'}`}>
            <span className="seat-state">{status}</span><span className="seat-avatar">{p.name.trim().slice(0, 1).toLocaleUpperCase('vi-VN')}{g.shields.includes(p.id) && <span className="seat-shield" aria-label="Được CHE CHẮN">🛡</span>}</span>
            <strong>{p.name}{mine ? ' · Bạn' : ''}</strong>
            <span className="seat-hand"><span className="mini-hand" aria-hidden="true">{Array.from({ length: p.handCount }, (_, n) => <i key={n}/>)}</span>{p.handCount} lá</span>
            {p.role && <span className={`seat-reveal ${p.role}`}>{p.role === 'actor' ? 'KẺ DIỄN' : 'NGƯỜI THẬT'}</span>}
          </button>
        </div>;
      })}
    </div>
    <div className="table-commentary"><span className="commentary-dot"/><p>{g.log.at(-1)?.text || 'Chia sẻ mã phòng. Mỗi người giữ một bí mật.'}</p></div>
    <p className="table-selection-help">{choosing ? 'Bấm vào ghế sáng để chọn người. Xác nhận bằng nút hành động bên dưới.' : g.phase === 'turn' && g.active === g.me.id ? 'Chọn một lá trên tay để hiện các mục tiêu hợp lệ.' : 'Bạn luôn ngồi phía dưới bàn. Thứ tự chơi giữ nguyên theo ghế.'}</p>
  </section>;
}
