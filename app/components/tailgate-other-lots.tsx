const OTHER_LOTS = [
  {
    name: 'The Film Room',
    href: 'https://the-film-room.venues.prophecyhosting.com/',
    note: 'The tape, not the lot',
  },
  {
    name: 'The Booth',
    href: 'https://the-booth.venues.prophecyhosting.com/',
    note: 'Upstairs, same calls',
  },
] as const

export function TailgateOtherLots() {
  return (
    <aside className="tailgate-other-lots" aria-label="Same lines, different lot">
      <span className="tailgate-other-lots__pin" aria-hidden="true" />
      <span className="tailgate-other-lots__tape">Tacked to the frame</span>
      <p>Same lines. Different lot.</p>
      <div className="tailgate-other-lots__links">
        {OTHER_LOTS.map((lot) => (
          <a key={lot.href} href={lot.href} rel="noreferrer noopener">
            <strong>{lot.name}</strong>
            <span>{lot.note}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}
