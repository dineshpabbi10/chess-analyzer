---
title: How to analyse your own chess games (a routine that actually works)
description: Most players run an engine, nod at the red marks, and learn nothing. Here is a repeatable routine that turns one game into one concrete lesson.
date: 2026-08-01T09:00:00.000Z
tags:
  - improvement
  - analysis
draft: false
---

Running an engine over a game is easy. Learning something from it is not. The
usual failure looks like this: you click through the report, see that move 24 was
a blunder, think *"yes, obviously"*, and close the tab. Nothing changes.

The problem is that the engine answers a question you didn't ask. It tells you
**what** the best move was. Improvement comes from understanding **why you didn't
play it**.

Here is a routine that fixes that. It takes about ten minutes per game.

## 1. Guess before you look

Before you turn the engine on, replay the game and write down — actually write
down — the two or three moments where you felt uncertain. Where did you stop
knowing what to do? Where did you spend most of your clock?

This matters because your *felt* difficulty and your *actual* mistakes often
happen at different moves. That gap is the most useful thing in the whole
exercise.

## 2. Now run the engine, and compare the lists

Run the review and look at where the real errors are. You will usually find one
of three patterns:

- **You felt fine and it was a blunder.** This is a knowledge or blindness
  problem: you didn't see the idea at all. These are the moves worth studying
  deeply.
- **You felt uncertain and it was fine.** Good news, and worth noticing — you are
  probably burning clock on positions you actually handle well.
- **You felt uncertain and it was bad.** This is a decision-making problem. You
  knew something was wrong and still couldn't find it.

## 3. Ask "what would I need to have seen?"

For each real mistake, don't just note the better move. Name the *pattern*:

- Did you miss a specific tactic? (a fork, a pin, a back-rank issue)
- Did you miss that a piece was undefended?
- Did you have a plan and keep executing it after it stopped making sense?
- Did you know the right idea but reject it because it looked scary?

That sentence — "I missed that my knight was the only defender of f2" — is the
lesson. The move itself isn't transferable. The pattern is.

## 4. Replay the position, don't just read about it

Reading "Nxf7 was winning" builds almost nothing. Sitting in the position and
having to *find* the move is what builds recognition. This is why our review has
a **Drill mistakes** button: it replays each position from just before your error
and asks you to find something better. Same positions, active recall.

## 5. Look for repeats across games, not within one

One blunder is noise. The same blunder three times is a training plan.

This is the single biggest reason to analyse in batches rather than one game at a
time. When you look at ten games together, questions become answerable:

- Is my accuracy worse in the endgame than the opening?
- Do my blunders cluster after move 30 — that is, when I'm short on time?
- Is there an opening where I score badly *and* play inaccurately?

The [Coach](/coach) does exactly this aggregation: it analyses a batch of your
recent games and reports accuracy by phase, blunder rate over the course of the
game, and per-opening results. The point isn't the numbers themselves — it's that
they tell you which of the four or five things you *could* work on is actually
costing you games.

## A note on accuracy scores

Don't chase the accuracy percentage. It is a useful summary, but it is heavily
influenced by how sharp the position was — a quiet game where nobody had a chance
to go wrong will score higher than a messy fight you defended brilliantly.

Use it as a trend across many games, not a grade on one.

## The short version

1. Note where you felt lost, *before* the engine.
2. Run the review and compare the two lists.
3. For each real error, name the pattern, not the move.
4. Replay the position instead of reading the answer.
5. Batch ten games to find what repeats.

Ready to try it? [Review a game](/) or
[batch-analyse your recent games](/coach).
