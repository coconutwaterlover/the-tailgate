# The three venue types

Six personas exist; **three are the focus, and a venue should be built for exactly one of them.** A
venue that tries to serve all three serves none — the trader wants density the player finds
oppressive, and the debater wants conversation the trader scrolls past.

Ask which one. If the creator is unsure, ask what their audience does *now*: reads charts, argues in
a group chat, or kills five minutes on their phone.

---

## Trader — crypto-native, here for the edge

Comes from trading. Wants to see whether the market is mispriced, and to act before it corrects.
Reads a chart before reading a headline.

**Build for density.** Numbers on screen beat whitespace. This is the one venue type where a wall of
data is the point.

- `<PriceChart market …>` — the movement, not just the current price. **This is the surface that
  makes a trader venue feel like one.**
- `<MarketDetail chart={…}>` — the chart slot is there so you can put it in.
- `<TradePulse>` and `<LiveTrades>` — flow, live.
- `<PositionsTable wallet>` — their book, prominently, not hidden behind sign-in copy.
- `<Leaderboard metric="edge">` — **edge, not volume**. A trader cares who is *right*, not who is
  loudest.
- `useLiveStats`, `usePriceHistory` if you need the raw numbers.

Tone: terminal, not tabloid. No exclamation marks. Precision reads as respect.

---

## Player — here for the game

Wants to be entertained in short bursts, usually on a phone. Will not read a paragraph. Predicts,
sees the number move, comes back tomorrow.

**Build for speed.** One decision per screen. Big targets. Almost no chrome.

- `<MarketCard>` with `renderOutcome` — make the outcome buttons the whole card.
- `<MarketGrid variant="list">` or a one-per-screen stack; mobile-first, thumb-reachable.
- `<FeaturedMarket>` — give them one thing to answer right now rather than a menu.
- `<MiniLeaderboard>` — light competition, not a spreadsheet.
- Countdown and resolution time up front: urgency is the mechanic.

Tone: short, warm, playful — never a casino. They *call* things and are right or wrong.

---

## Debater — here to be proved right

Has an opinion and wants it on the record, in public, with an audience. The market is the scoreboard
for an argument they were already having.

**Build for the argument.** The position is a claim; the venue should let them make it and defend it.

- `<Comments subjectType subjectRef>` — the argument itself, on the market.
- `<TakeCard>` and `useFeed` — positions as posts, with reasoning attached.
- `<FollowButton>` / `<FollowerCount>` — reputations only compound if you can follow someone.
- `<ResolutionReceipt marketId>` — **how it resolved, with sources.** This is the receipt they came
  for, and the difference between "you lost" and "here is why you were wrong".
- `<UserBadge wallet>` with the profile's win rate and streak — the record, visible.

Tone: opinionated and specific. This venue has a voice and takes sides in how it frames questions.

---

## What is common to all three

Whichever it is: the markets must obviously be about the subject (`useVenueMarkets`), the trade path
stays in the kit, and nobody bets — they predict, take a position, and are right or wrong.
