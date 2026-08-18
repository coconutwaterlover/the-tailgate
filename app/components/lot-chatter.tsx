'use client'

const EMPTY_LINE = "lot's still warming up — first call gets the chairs talking"

export function LotChatter({ lines }: { lines: string[] }) {
  const spoken = lines.length > 0 ? lines : [EMPTY_LINE]
  const loop = spoken.length === 1 ? [...spoken, ...spoken] : spoken

  return (
    <section className="tailgate-chatter" aria-label="Lot chatter">
      <span className="tailgate-chatter__tape">Overheard</span>
      <div className="tailgate-chatter__viewport">
        <div className="tailgate-chatter__reel">
          <ul className="tailgate-chatter__track">
            {loop.map((line, index) => (
              <li key={`a-${index}`}>{line}</li>
            ))}
          </ul>
          <ul className="tailgate-chatter__track" aria-hidden="true">
            {loop.map((line, index) => (
              <li key={`b-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
