---
title: Accuracy and centipawn loss, explained
description: What the numbers in a game report actually measure, why a 90% accuracy game can still be a disaster, and which metric to pay attention to.
date: 2026-08-02T09:00:00.000Z
tags:
  - analysis
  - engine
draft: false
---

Every game report hands you a couple of numbers: an **accuracy** percentage and,
often, an **average centipawn loss**. They sound interchangeable. They are not,
and knowing the difference changes how you read your own games.

## Centipawns: the engine's unit of advantage

Engines score positions in **centipawns** — hundredths of a pawn. An evaluation of
`+1.00` means White's position is worth roughly one extra pawn. `-2.50` means
Black is better by about two and a half pawns.

"Roughly" is doing real work in that sentence. The engine isn't counting material;
it's estimating the whole position — king safety, activity, structure — and
expressing it in pawn-equivalents because that's a unit humans understand.

**Centipawn loss** for a single move is the difference between the best available
evaluation and what you actually got. If the best move kept you at `+0.80` and
your move left you at `+0.20`, that move cost 60 centipawns.

Average centipawn loss (ACPL) is that averaged over all your moves. Lower is
better. Strong players are often under 20; club players are frequently over 50.

## Accuracy: the same data, run through a win-probability curve

Accuracy starts from centipawns but adds a crucial step: it converts the
evaluation into a **probability of winning**, then measures how much of that
probability your move gave away.

Why bother? Because centipawns are not linear in importance:

- Going from `+0.30` to `-0.30` is a 60-centipawn swing that genuinely matters —
  you handed over the initiative in a balanced game.
- Going from `+9.00` to `+8.40` is also 60 centipawns, and means nothing at all.
  You were completely winning; you still are.

A win-probability model treats those correctly: the first is a real error, the
second is a rounding difference. That's why accuracy tracks "did this move change
the likely result?" rather than "did this move change the number?".

## The consequence: high accuracy can hide a bad game

This is the bit that confuses people, and it's worth internalising.

Once a position is genuinely lost, almost nothing you do changes the win
probability — it's already near zero. So your *accuracy* for those moves stays
high even while your *centipawn loss* balloons. A game where you collapsed early
and then got mated can post a respectable accuracy figure.

The reverse also happens. A tense, sharp game where every move mattered will
punish small inaccuracies hard, because in a balanced position a small evaluation
change is a large win-probability change.

**Practical reading:**

- **Accuracy** answers *"how well did I convert my chances?"*
- **ACPL** answers *"how cleanly did I play, regardless of the result?"*
- Big gap between them (high accuracy, high ACPL) usually means a game that was
  decided early and then coasted.

## Why the same game scores differently on different sites

Three reasons, all legitimate:

1. **Engine strength and search depth.** A stronger engine, or a deeper search,
   finds better moves — which makes your moves look comparatively worse. Deeper
   analysis usually *lowers* your reported accuracy. That isn't a bug; it's a more
   demanding examiner.
2. **The win-probability formula.** Different sites use slightly different curves
   for turning centipawns into a win percentage.
3. **What counts as a move.** Some tools exclude opening book moves, or forced
   recaptures, from the average. Others don't.

So compare your numbers to *your own* numbers over time, on the same tool, at the
same depth. Cross-site comparisons are noise.

## What to actually do with the numbers

Honestly? Mostly ignore the headline percentage and look at the distribution.

One blunder and forty excellent moves is a completely different game from twelve
inaccuracies, even if the accuracy figure lands in the same place. The first is a
concentration problem; the second is an understanding problem. They need different
training.

Want to see it on one of your own games? [Run a review](/) — or check the
[Analysis Board](/tools/analysis) if you'd rather watch the evaluation move as you
play through a line.
