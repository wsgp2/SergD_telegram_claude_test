#!/bin/bash
# Patches the Telegram plugin to add voice message transcription support.
# Idempotent — safe to run multiple times.
# Designed to be called from a SessionStart hook.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VOICE_HANDLER="$SCRIPT_DIR/voice_handler.ts"
MARKER="VOICE TRANSCRIPTION HANDLER"

# Find the telegram plugin directory (handles version changes)
PLUGIN_BASE="$HOME/.claude/plugins/cache/claude-plugins-official/telegram"
if [ ! -d "$PLUGIN_BASE" ]; then
  echo '{"systemMessage": "voice_transcriber: telegram plugin not found, skipping"}'
  exit 0
fi

PLUGIN_DIR=$(ls -d "$PLUGIN_BASE"/*/ 2>/dev/null | sort -V | tail -1)
if [ -z "$PLUGIN_DIR" ]; then
  echo '{"systemMessage": "voice_transcriber: no plugin version found, skipping"}'
  exit 0
fi

PLUGIN_FILE="${PLUGIN_DIR}server.ts"

if [ ! -f "$PLUGIN_FILE" ]; then
  echo '{"systemMessage": "voice_transcriber: server.ts not found, skipping"}'
  exit 0
fi

# Already patched — nothing to do
if grep -q "$MARKER" "$PLUGIN_FILE" 2>/dev/null; then
  exit 0
fi

# Verify insertion point exists
if ! grep -q "async function handleInbound(" "$PLUGIN_FILE"; then
  echo '{"systemMessage": "voice_transcriber: handleInbound not found, patch skipped (plugin structure changed?)"}'
  exit 0
fi

# Insert voice handler before 'async function handleInbound('
python3 -c "
plugin_file = '${PLUGIN_FILE}'
handler_file = '${VOICE_HANDLER}'
with open(plugin_file, 'r') as f:
    content = f.read()
with open(handler_file, 'r') as f:
    handler = f.read()
marker = 'async function handleInbound('
if marker in content:
    content = content.replace(marker, handler + chr(10) + chr(10) + marker)
    with open(plugin_file, 'w') as f:
        f.write(content)
    print('{\"systemMessage\": \"voice_transcriber: patch applied\"}')
else:
    print('{\"systemMessage\": \"voice_transcriber: insertion point not found\"}')
"
