# How a venue is written

## The words

Never **bet**, **bets**, **betting**, **bettor**, **odds**, **wager**, **gamble**. People *predict*,
take a *position*, *call* something, are *right or wrong*. This is the line between a prediction
market and a bookmaker, and a model trained on sportsbook copy will reach for the wrong half of it
without noticing.

Write like the subject's own press, not like a sportsbook. A Formula 1 venue sounds like the paddock;
an elections venue sounds like a newsroom; a crypto venue sounds like a terminal.

## Copy that earns its place

- **Say what the venue is about, not that it is a venue.** "Call the season before the season calls
  it" beats "Predict Formula 1 markets".
- **The empty state is copy too.** "Nothing to call right now — check back when the paddock opens"
  is a voice; "No markets found" is a database.
- **Name the thing.** A market titled "Exact score" tells a reader nothing; the venue's own headings
  should not either.

## Scene before colour

Decide what the place *is* before choosing what it looks like. A night race under floodlights, a
trading terminal at 3am, a newsroom on election night — the palette follows from the scene, and a
palette chosen first tends to arrive as "dark theme with an accent".

## What makes a venue feel alive

In rough order of return:

1. **Markets that are clearly about the subject.** Scoping beats styling. A beautiful venue showing
   the wrong markets is broken; a plain one showing the right markets is a venue.
2. **A lead.** One market given room — `<FeaturedMarket>` — reads as editorial judgement rather than
   a dump of cards.
3. **Structure that matches the subject.** Fixtures group by date. Ballots are a table. A docket is a
   list. Do not put everything in a grid because a grid is the default.
4. **Resolution shown, not hidden.** `<ResolutionReceipt>` renders how a market resolved, with its
   sources — the answer to "why did I lose?". Venues that show it get trusted.

## What to leave alone

The header bar carries sign-in and is trade-adjacent. The checkout drawer is mounted once. Neither is
yours — and neither needs to be, because nothing about how a venue *looks* lives in them.
