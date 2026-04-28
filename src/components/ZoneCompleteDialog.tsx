export function ZoneCompleteDialog({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="zone-dialog" aria-label="Zone complete">
      <p className="eyebrow">District Secured</p>
      <h2>Broken Market Cleared</h2>
      <p>The citadel crews stripped the block and pushed the perimeter forward.</p>
      <button type="button" onClick={onRestart}>
        Run Block Again
      </button>
    </section>
  );
}
