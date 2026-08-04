---
title: What makes a chess move "brilliant"?
description: Brilliant, Great, Best, Excellent — where the labels in a game report come from, and why two tools can disagree about the same move.
date: 2026-08-03T09:00:00.000Z
tags:
  - analysis
  - engine
draft: false
---

Game reports label every move: **Best**, **Excellent**, **Good**, **Inaccuracy**,
**Mistake**, **Blunder** — plus the special ones, **Brilliant** and **Great**.
Those last two are the ones people care about, and the ones nobody explains.

Here's how the classification actually works.

## Most labels are just one number

The ordinary labels come almost entirely from a single quantity: **how much win
probability did this move give away?**

| Win probability lost | Typical label |
| --- | --- |
| ~0, and it was the engine's top choice | Best |
| under ~2% | Excellent |
| under ~5% | Good |
| under ~10% | Inaccuracy |
| under ~20% | Mistake |
| more | Blunder |

That's it. No judgement about style, no understanding of your plan. A quiet
developing move and a brilliant defensive resource both land in "Best" if they
don't lose anything.

There's also **Book**, which just means "this is known opening theory" — the
engine isn't grading you yet.

## Brilliant needs a sacrifice

A move gets called **Brilliant** when it does something that looks wrong and
isn't. Concretely, most implementations require roughly:

1. **You gave up material.** Not a trade — a genuine investment, typically a piece
   or more of net material.
2. **It's still good.** The move is among the engine's best, and the position after
   it is at least holding.
3. **You weren't already completely winning.** If you're up a queen, throwing a
   knight away is a flourish, not a brilliancy.
4. **You aren't simply lost.** A desperate sacrifice in a hopeless position is not
   brilliant, however pretty.

That combination — *material down, evaluation fine* — is what makes a move feel
brilliant to a human. You have to see further than the material count to justify
it.

## Great is about being the only move

**Great** is a different idea: it's not about sacrifice, it's about **scarcity**.

A move is Great when it's essentially the *only* move that holds the position —
the second-best option is dramatically worse. This is why an engine needs to search
more than one line to detect it: you have to know what the alternatives were worth
before you can say the best move was uniquely good.

Finding a Great move means you spotted the one narrow path. Finding a Best move in
a position with five reasonable options is much easier, even though both keep the
evaluation.

## Miss is the mirror image of a blunder

**Miss** deserves a mention because it's the most useful label for improvement.
It doesn't mean you played a bad move in a bad position — it means you had
something genuinely winning available, often a mate, and let most of it slip.

Blunders lose games you were fine in. Misses lose games you should have won. If
your report is full of Misses, your problem isn't defence — it's conversion.

## Why tools disagree

Two reports on the same game can label the same move differently, for reasons that
are all defensible:

- **Search depth.** A deeper search may find that your "brilliant" sacrifice was
  actually just losing — or that a move you thought was fine was the only move.
- **Sacrifice thresholds.** How much material must you shed? Does a pawn count? Is
  a temporary sacrifice that's immediately regained still a sacrifice?
- **Whether "only move" is checked at all.** Detecting Great requires multi-line
  analysis, which is more expensive, so some tools skip it.
- **Book cut-off.** How long is a move still "theory" rather than graded?

None of these have a single right answer — which is worth remembering the next time
a tool declines to award you the brilliancy you feel you earned.

## Reading the labels usefully

The labels are a *summary*, not a verdict. What matters is the shape of them:

- Lots of **Inaccuracies**, few blunders → you understand the game but drift.
- Few inaccuracies, occasional **Blunders** → tactics or concentration.
- Several **Misses** → you're creating chances and not taking them.

Curious how your own games break down? [Run a game review](/), or read our
[routine for analysing your own games](/blog/how-to-analyze-your-own-chess-games).
