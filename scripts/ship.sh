#!/usr/bin/env bash
set -euo pipefail

# 1. Ensure we're on main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Error: You must be on main to ship. Currently on: $BRANCH"
  exit 1
fi

# 2. Check for changes
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "Nothing to ship — no changes detected."
  exit 0
fi

# 3. Prompt for description
echo ""
echo "Describe the purpose of these changes:"
read -r DESCRIPTION

if [ -z "$DESCRIPTION" ]; then
  echo "Error: Description cannot be empty."
  exit 1
fi

# 4. Generate branch name from description
BRANCH_NAME="ship/$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr ' ' '-' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-50)"

# 5. Create branch, stage, commit
git checkout -b "$BRANCH_NAME"
git add -A
git commit -m "$DESCRIPTION"

# 6. Push
echo ""
echo "Pushing $BRANCH_NAME to origin..."
git push -u origin HEAD

# 7. Create draft PR
echo "Creating draft PR..."
gh pr create --draft --title "$DESCRIPTION" --base main --body "## Purpose

$DESCRIPTION"

echo ""
echo "Done! Draft PR created."
