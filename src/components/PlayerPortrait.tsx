/** Public seat artwork; never encodes hidden roles. */
export default function PlayerPortrait({ index }: { index: number }) {
  return <span className="player-portrait" aria-hidden="true" style={{ backgroundPosition: `${(index % 4) * 100 / 3}% ${index < 4 ? 0 : 100}%` }}/>;
}
