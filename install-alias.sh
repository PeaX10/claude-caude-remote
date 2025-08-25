#!/bin/bash

# Installation script for claude-remote alias

SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/claude-remote.sh"

echo "📦 Installing claude-remote alias..."

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Add alias
echo "" >> "$SHELL_RC"
echo "# Claude Code Remote Control" >> "$SHELL_RC"
echo "alias claude-remote='$SCRIPT_PATH'" >> "$SHELL_RC"

echo "✅ Alias installed!"
echo ""
echo "🔄 Please run: source $SHELL_RC"
echo ""
echo "📝 Usage:"
echo "   claude-remote \"Project Name\" \"project-id\""
echo ""
echo "Example:"
echo "   cd /your/project"
echo "   claude-remote \"My Frontend\" \"frontend-001\""