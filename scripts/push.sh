#!/usr/bin/env bash
set -euo pipefail

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ]; then
  echo "You're on main. Push directly with git push."
  exit 1
fi

# Push the branch
echo "Pushing $BRANCH to origin..."
git push -u origin HEAD

# Check for existing PR
EXISTING_PR=$(gh pr list --head "$BRANCH" --json url --jq '.[0].url // empty' 2>/dev/null)

if [ -n "$EXISTING_PR" ]; then
  echo "PR already exists: $EXISTING_PR"
else
  echo "Creating draft PR..."
  gh pr create --draft --title "$BRANCH" --base main --fill
fi
