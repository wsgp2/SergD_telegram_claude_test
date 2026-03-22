// === VOICE TRANSCRIPTION HANDLER (auto-patched by voice_transcriber) ===
bot.on('message:voice', async ctx => {
  try {
    const voice = ctx.message.voice
    const fileInfo = await ctx.api.getFile(voice.file_id)
    if (!fileInfo.file_path) return
    const url = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`
    const res = await fetch(url)
    const buf = Buffer.from(await res.arrayBuffer())
    const oggPath = join(INBOX_DIR, `${Date.now()}-voice.ogg`)
    mkdirSync(INBOX_DIR, { recursive: true })
    writeFileSync(oggPath, buf)
    const proc = Bun.spawn(
      ['python3', join(homedir(), 'SergD_telegram_claude_test', 'voice_transcriber', 'transcribe.py'), oggPath],
      { stdout: 'pipe', stderr: 'pipe' }
    )
    const stdoutText = await new Response(proc.stdout).text()
    await proc.exited
    const transcription = stdoutText.trim() || '(не удалось расшифровать голосовое сообщение)'
    try { rmSync(oggPath, { force: true }) } catch {}
    await handleInbound(ctx, transcription, undefined)
  } catch (err) {
    process.stderr.write(`telegram channel: voice transcription failed: ${err}\n`)
  }
})

bot.on('message:audio', async ctx => {
  try {
    const audio = ctx.message.audio
    const fileInfo = await ctx.api.getFile(audio.file_id)
    if (!fileInfo.file_path) return
    const url = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`
    const res = await fetch(url)
    const buf = Buffer.from(await res.arrayBuffer())
    const ext = fileInfo.file_path.split('.').pop() ?? 'mp3'
    const audioPath = join(INBOX_DIR, `${Date.now()}-audio.${ext}`)
    mkdirSync(INBOX_DIR, { recursive: true })
    writeFileSync(audioPath, buf)
    const proc = Bun.spawn(
      ['python3', join(homedir(), 'SergD_telegram_claude_test', 'voice_transcriber', 'transcribe.py'), audioPath],
      { stdout: 'pipe', stderr: 'pipe' }
    )
    const stdoutText = await new Response(proc.stdout).text()
    await proc.exited
    const transcription = stdoutText.trim() || '(не удалось расшифровать аудио)'
    try { rmSync(audioPath, { force: true }) } catch {}
    await handleInbound(ctx, transcription, undefined)
  } catch (err) {
    process.stderr.write(`telegram channel: audio transcription failed: ${err}\n`)
  }
})
// === END VOICE TRANSCRIPTION HANDLER ===
