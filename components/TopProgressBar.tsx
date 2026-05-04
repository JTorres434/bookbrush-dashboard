/**
 * Thin gradient bar fixed to the top of the viewport.
 * Pure CSS animation — fills 0 → 90% over 1.2s, then sits at 90% (the
 * remaining 10% completes when the page actually finishes loading and
 * this component unmounts). Inspired by GitHub/YouTube's progress bars.
 */
export function TopProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[300] h-[3px] pointer-events-none">
      <div className="bb-progress-track h-full w-full overflow-hidden">
        <div className="bb-progress-fill h-full bg-bb-gradient" />
      </div>
    </div>
  );
}
