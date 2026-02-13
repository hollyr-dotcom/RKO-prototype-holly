#!/bin/bash
#
# Setup git hooks for this repository
# Run this after cloning: ./scripts/setup-hooks.sh

HOOKS_DIR="scripts/git-hooks"
GIT_HOOKS_DIR=".git/hooks"

echo "Setting up git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository root"
    exit 1
fi

# Copy hooks
for hook in "$HOOKS_DIR"/*; do
    if [ -f "$hook" ]; then
        hook_name=$(basename "$hook")
        cp "$hook" "$GIT_HOOKS_DIR/$hook_name"
        chmod +x "$GIT_HOOKS_DIR/$hook_name"
        echo "✓ Installed $hook_name"
    fi
done

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "These hooks will:"
echo "  - Prevent committing bun.lock or yarn.lock files"
echo "  - Warn if non-npm lockfiles are detected in your working directory"
