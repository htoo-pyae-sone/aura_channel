#!/usr/bin/env bash
# Ship the working tree through the documented PR flow in one command.
#
#   npm run ship -- "Catalog: add X"
#
# Steps:
#   1. astro build     5s content-schema check — a bad code fails HERE, in
#                      seconds, not two minutes into CI
#   2. commit + push   straight to dev/hps
#   3. open PR         against main (reuses one that's already open)
#   4. wait for CI     the full `npm run verify` — this is the real gate
#   5. squash-merge
#   6. lockstep reset  dev/hps -> main, force-push
#
# Step 6 is not optional. A squash merge writes new SHAs into main, so
# without it dev/hps and main diverge permanently and every later PR demands
# an "update branch" that conflicts with changes it already merged.
#
# Safety: the ruleset covers refs/heads/main with an empty bypass list, so
# no direct push to main is possible — a red CI run stops this script before
# the merge, and main never sees an unverified commit.
set -euo pipefail

die() { echo "ship: $*" >&2; exit 1; }

[ $# -ge 1 ] || die 'usage: npm run ship -- "commit message"'

MSG="$1"
BRANCH=dev/hps
BASE=main
REMOTE=origin

# Resolve the repo root so the script works from any subdirectory.
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || die "not inside a git repository"
cd "$ROOT"

# git refuses to move the branch we are standing on during the lockstep
# reset, so being on main would make step 6 fail halfway through.
CURRENT=$(git branch --show-current)
[ "$CURRENT" = "$BRANCH" ] || die "checkout $BRANCH first (currently on ${CURRENT:-detached})"

command -v gh >/dev/null 2>&1 || die "gh CLI not found — install github-cli"

DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
  # --- 1. validate -------------------------------------------------------
  # Content collections are validated during the build, so this catches a
  # malformed code, a mistyped status, or a bad episode shape before we
  # touch the remote.
  echo "ship: 1/6  validating (astro build)"
  LOG=$(mktemp)
  if ! ./node_modules/.bin/astro build >"$LOG" 2>&1; then
    tail -n 25 "$LOG" >&2
    rm -f "$LOG"
    die "build failed — nothing was pushed"
  fi
  rm -f "$LOG"

  # --- 2. commit + push --------------------------------------------------
  echo "ship: 2/6  committing and pushing $BRANCH"
  git add -A
  git commit -q -m "$MSG"
else
  echo "ship: 2/6  working tree clean — skipping commit"
fi

# Push unconditionally, even on a clean tree. A commit left behind by an
# earlier run — say one that stopped at a red CI check — still has to reach
# the remote, otherwise gh pr create opens a PR against a branch SHA that
# predates it and the PR comes out empty.
git push -q "$REMOTE" "$BRANCH" ||
  die "push rejected — reconcile $BRANCH with $REMOTE/$BRANCH first"

# --- 3. open (or reuse) the PR --------------------------------------------
# gh pr create fails when one is already open for this head branch, which is
# the normal path when a previous run stopped at a red CI check.
echo "ship: 3/6  opening PR"
gh pr create --base "$BASE" --head "$BRANCH" \
  --title "$MSG" \
  --body "Shipped via \`npm run ship\`.

\`npm run verify\` runs in CI before merge." \
  >/dev/null 2>&1 || true

PR=$(gh pr view "$BRANCH" --json number --jq .number 2>/dev/null) ||
  die "no open PR found for $BRANCH"
STATE=$(gh pr view "$BRANCH" --json state --jq .state)
[ "$STATE" = "OPEN" ] || die "PR #$PR is $STATE — nothing to do"
echo "ship:        PR #$PR opened"

# --- 4. wait for CI -------------------------------------------------------
# gh pr checks exits non-zero if any check fails, so this is the gate.
echo "ship: 4/6  waiting for CI (Build & verify)"
if ! gh pr checks "$PR" --watch --interval 15; then
  echo "" >&2
  gh pr checks "$PR" >&2 || true
  die "CI failed — not merging. Fix, then re-run npm run ship."
fi

# --- 5. merge -------------------------------------------------------------
echo "ship: 5/6  squash-merging #$PR"
gh pr merge "$BRANCH" --squash

# --- 6. lockstep ----------------------------------------------------------
echo "ship: 6/6  resetting $BRANCH to $BASE"
git fetch -q origin
git branch -f "$BASE" "origin/$BASE"
git reset --hard "origin/$BASE" -q
git push -q --force-with-lease origin "$BRANCH"

echo ""
echo "ship: done"
echo "      $BASE       = $(git rev-parse --short origin/$BASE)"
echo "      $BRANCH = $(git rev-parse --short origin/$BRANCH)"
echo "      Vercel is building $BASE now"
