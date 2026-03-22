# Telegram Voice Transcriber for Claude Code

Автоматическая расшифровка голосовых сообщений Telegram через OpenAI Whisper для Claude Code Telegram plugin.

## Как работает

Официальный Telegram-плагин Claude Code (v0.0.1) обрабатывает только текст и фото. Голосовые сообщения игнорируются.

Этот проект добавляет поддержку голосовых через **авто-патч**:

1. `patch_plugin.sh` — добавляет обработчик `message:voice` и `message:audio` в `server.ts` плагина
2. При получении голосового: скачивает .ogg файл, транскрибирует через Whisper, отправляет текст в Claude
3. `SessionStart` хук автоматически переприменяет патч после обновления плагина

## Архитектура

```
Telegram → voice message → grammy bot (plugin)
                              ↓
                     voice_handler.ts (patch)
                              ↓
                     скачивает .ogg файл
                              ↓
                     transcribe.py (Whisper)
                              ↓
                     handleInbound(ctx, текст)
                              ↓
                     Claude получает текст
```

## Требования

- Claude Code с Telegram-плагином (`plugin:telegram@claude-plugins-official`)
- Python 3 + OpenAI Whisper (`pip install openai-whisper`)
- ffmpeg (для обработки аудио)
- Bun (уже установлен с Claude Code)

## Установка

### 1. Убедитесь что Whisper установлен

```bash
pip install openai-whisper
whisper --help
```

### 2. Примените патч вручную (первый раз)

```bash
./voice_transcriber/patch_plugin.sh
```

### 3. Перезапустите Claude Code

```bash
claude --channels plugin:telegram@claude-plugins-official
```

Патч применится автоматически при каждом старте сессии через `SessionStart` хук в `.claude/settings.local.json`.

## Файлы

| Файл | Описание |
|------|----------|
| `voice_transcriber/transcribe.py` | Python-скрипт для транскрипции через Whisper (модель: small) |
| `voice_transcriber/voice_handler.ts` | TypeScript-код обработчика голосовых для grammy |
| `voice_transcriber/patch_plugin.sh` | Скрипт авто-патча плагина (идемпотентный) |
| `.claude/settings.local.json` | Настройки Claude Code: разрешения + SessionStart хук |

## Как переживает обновления плагина

1. Плагин обновляется → файлы в кеше перезаписываются
2. При следующем запуске Claude Code срабатывает `SessionStart` хук
3. `patch_plugin.sh` обнаруживает что патч отсутствует и применяет его заново
4. После перезапуска Claude Code голосовые снова работают

**Важно:** после обновления плагина нужен двойной перезапуск (первый — патчит, второй — подхватывает патч).

## Модель Whisper

По умолчанию используется модель `small` (~500MB, скачивается при первом запуске). Для смены модели отредактируйте `transcribe.py`:

- `tiny` — быстрая, низкое качество
- `base` — быстрая, среднее качество
- `small` — баланс скорости и качества (по умолчанию)
- `medium` — медленная, высокое качество
- `large` — очень медленная, максимальное качество
