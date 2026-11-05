'use client';
import type { Card, GameView } from '@/types/game';
import { canChoosePlayer } from '@/lib/table';
import PlayerPortrait from './PlayerPortrait';
import GameIcon from './GameIcon';
const ACTIONS: Record<string, string> = { '♥': 'CHE CHẮN', '♦': 'SOI KÍN', '♣': 'ĐỔI BÀI', '♠': 'CHẤT VẤN' };
export default function RoomTable({ game: g, card, target, onTarget, busy = false }: { game: GameView; card?: Card; target: string; onTarget: (id: string) => void; busy?: boolean }) {
  const name = (id: string) => g.players.find(p => p.id === id)?.name || '?';
  const actor = g.pending?.actor || (g.phase === 'turn' ? g.active : undefined);
  const recipient = g.pending?.target || (canChoosePlayer(g, card, target) ? target : undefined);
  const seatOrder = [...g.players.filter(p => p.id !== g.me.id), ...g.players.filter(p => p.id === g.me.id)];
  const seatMap: Record<number, number[]> = { 4: [0, 2, 4, 5], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 4, 6, 5], 7: [0, 1, 2, 3, 4, 6, 5], 8: [0, 1, 2, 3, 4, 6, 7, 5] };
  const coordinates = [[310,100],[720,100],[910,300],[910,490],[710,510],[300,510],[85,330],[85,95]];
  const point = (id: string) => coordinates[seatMap[g.players.length]?.[seatOrder.findIndex(p => p.id === id)] ?? 0];
  const from = actor ? point(actor) : undefined, to = recipient ? point(recipient) : undefined;
  const choosing = g.players.some(p => canChoosePlayer(g, card, p.id));
  let headline = 'Mọi người đang tập hợp';
  let detail = `${g.players.length}/8 người · Cần ít nhất 4 người để bắt đầu.`;
  if (g.phase === 'turn') { headline = g.active === g.me.id ? 'Đến lượt bạn.' : `Đến lượt ${name(g.active)}.`; detail = card && g.active === g.me.id ? `${ACTIONS[card.slice(-1)]} · Chọn một người phía dưới, rồi xác nhận trên thanh thao tác.` : 'Quan sát hành động. Đừng tin quá sớm.'; }
  if (g.phase === 'swap') { headline = 'Hai lựa chọn. Một cuộc trao đổi.'; detail = `${name(g.pending!.actor)} và ${name(g.pending!.target)} đang chọn bài kín.`; }
  if (g.phase === 'question') { headline = `${name(g.pending!.target)} đang bị chất vấn.`; detail = 'Nêu một người khác và ít nhất một lý do. Được phép nói dối.'; }
  if (g.phase === 'discussion') { headline = 'Ai đáng tin?'; detail = 'Cả bàn thảo luận. Chủ phòng chuyển tiếp khi mọi người sẵn sàng.'; }
  if (g.phase === 'vote' || g.phase === 'revote') { headline = g.phase === 'revote' ? 'Một cơ hội cuối.' : 'Đã đến lúc quyết định.'; detail = `${g.voteCount}/${g.players.length} phiếu đã khóa${g.voted ? ' · Bạn đã bỏ phiếu.' : ' · Chọn người bị nghi, rồi khóa phiếu trên thanh thao tác.'}`; }
  if (g.phase === 'finished') { headline = `${g.result?.winner === 'real' ? 'Người Thật' : 'Kẻ Diễn'} thắng.`; detail = g.result?.unresolvedTie ? 'Vẫn đồng phiếu ở ranh giới.' : 'Vai đã được mở. Cùng xem lại điều gì đã xảy ra.'; }
  return <section className="investigation-board" aria-label="Bàn điều tra và người chơi">
    <header className="board-heading"><span>01 / BÀN ĐIỀU TRA</span><div className="case-rounds" aria-label={`Vòng ${g.round} trên 3`}>{[1, 2, 3].map(n => <span key={n} className={g.round >= n ? 'complete' : ''}>{n}</span>)}</div><span>{g.players.length} NGƯỜI CÓ MẶT</span></header>
    <div className={`table-scene players-${g.players.length}`}>{from && to && actor !== recipient && <svg className="action-trail" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="action-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#964497"/></marker></defs><path d={`M${from[0]} ${from[1]-25} Q${(from[0]+to[0])/2-70} ${(from[1]+to[1])/2} ${to[0]} ${to[1]+55}`} stroke="#964497" strokeWidth="4" strokeDasharray="10 9" strokeLinecap="round" fill="none" markerEnd="url(#action-arrow)"/></svg>}<div className="table-center"><div className="case-brief" aria-live="polite"><div><p className="case-label">{g.phase === 'lobby' ? 'CHỜ BẮT ĐẦU' : `VÒNG ${g.round} / 3`}</p><h2>{headline}</h2><p>{detail}</p></div><span className="case-mark" aria-hidden="true">◒</span></div>
    {(actor || recipient) && <div className="interaction-strip"><span>{actor ? name(actor) : 'Lựa chọn của bạn'}</span><b aria-hidden="true">→</b><span className={recipient ? 'selected-recipient' : ''}>{recipient ? name(recipient) : 'Chưa chọn mục tiêu'}</span>{card && g.phase === 'turn' && g.active === g.me.id && <small>{ACTIONS[card.slice(-1)]}</small>}</div>}
    <div className="table-emblem" aria-hidden="true"><span>NGHI NGỜ NHÂN SINH</span><strong>AI ĐANG DIỄN?</strong><i>？<GameIcon/>？</i></div>
    {g.phase !== 'lobby' && <div className="table-decks"><div><span className="deck-back"><GameIcon/></span><small>RÚT · {g.deckCount}</small></div><div><span className={`deck-face ${/[♥♦]/.test(g.discard.at(-1) || '') ? 'red' : ''}`}>{g.discard.at(-1) || '—'}</span><small>BỎ · {g.discard.length}</small></div></div>}
    </div><div className={`suspect-grid ${choosing ? 'is-choosing' : ''}`}>
      {seatOrder.map((p, i) => {
        const mine = p.id === g.me.id;
        const acting = (g.phase === 'turn' && p.id === g.active) || (g.phase === 'question' && p.id === g.pending?.target);
        const participant = (g.phase === 'swap' || g.phase === 'question') && (p.id === g.pending?.actor || p.id === g.pending?.target);
        const eligible = canChoosePlayer(g, card, p.id), selected = eligible && target === p.id;
        const status = selected ? 'MỤC TIÊU' : acting ? g.phase === 'question' ? 'ĐANG TRẢ LỜI' : 'ĐẾN LƯỢT' : participant ? 'ĐANG TƯƠNG TÁC' : p.id === g.host ? 'CHỦ PHÒNG' : 'ĐANG QUAN SÁT';
        return <button key={p.id} type="button" data-seat={seatMap[g.players.length]?.[i] ?? i} className={`suspect-card ${mine ? 'is-me' : ''} ${acting ? 'is-active' : ''} ${participant ? 'is-participant' : ''} ${selected ? 'is-target' : ''}`} disabled={!eligible || busy} onClick={() => onTarget(p.id)} aria-pressed={selected} aria-label={`${p.name}, ${p.handCount} lá${mine ? ', bạn' : ''}, ${acting ? 'đang hành động, ' : ''}${eligible ? 'chọn làm mục tiêu' : 'người chơi'}`}>
          <span className="suspect-meta"><span>NGƯỜI {String(i + 1).padStart(2, '0')}</span><span className="suspect-status">{status}</span></span>
          <span className="suspect-person"><PlayerPortrait index={mine ? 4 : [0, 1, 3, 5, 2, 6, 7][i % 7]}/><span><strong>{p.name}{mine ? " · Bạn" : ""}</strong><small>{mine ? 'Bạn · ' : ''}{p.handCount} lá đang giữ</small></span></span>
          <span className="suspect-bottom">{p.role ? <b className={p.role === 'actor' ? 'actor-revealed' : ''}>{p.role === 'actor' ? 'KẺ DIỄN' : 'NGƯỜI THẬT'}</b> : <span className="sealed-role">THÂN PHẬN KÍN</span>}{g.shields.includes(p.id) ? <span className="shield-label"><GameIcon kind="shield"/><small>CHE CHẮN</small></span> : <span className="paper-cards" aria-hidden="true">{Array.from({ length: p.handCount }, (_, n) => <i key={n}/>)}<em>×{p.handCount}</em></span>}</span>
        </button>;
      })}
      {g.phase === 'lobby' && Array.from({ length: Math.max(0, 4 - g.players.length) }, (_, i) => <div className="empty-suspect" key={`empty-${i}`}><span>+</span>Đợi một người bạn</div>)}
    </div>
    </div><div className="board-footer"><span>{choosing ? 'Chọn người → Xác nhận ở thanh phía trên' : 'Không ai bị loại. Mỗi hành động là một manh mối.'}</span><span>RÚT {g.deckCount} / BỎ {g.discard.length}{g.discard.at(-1) ? ` · ${g.discard.at(-1)}` : ''}</span></div>
  </section>;
}
