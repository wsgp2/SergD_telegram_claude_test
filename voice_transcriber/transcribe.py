#!/usr/bin/env python3
"""Transcribe audio file using OpenAI Whisper. Outputs text to stdout."""
import sys
import warnings

warnings.filterwarnings("ignore")

import whisper


def main():
    if len(sys.argv) < 2:
        print("Usage: transcribe.py <audio_file> [model]", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "small"

    model = whisper.load_model(model_name)
    result = model.transcribe(audio_path)
    print(result["text"].strip())


if __name__ == "__main__":
    main()
