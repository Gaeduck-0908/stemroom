# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Buildless HTML/CSS/JavaScript web interface with English/Korean localization, plus a FastAPI service that runs local HTDemucs-class stem separation.

## Users

One person using their own audio files to create editable song stems.

## Product Purpose

Turn an MP3 or WAV into six controllable stems: vocals, drums, bass, guitar, piano, and other instruments. The user can audition the mix, isolate or mute a stem, adjust levels, and download each result as WAV, MP3, or a ZIP.

## Positioning

A private, focused stem workstation rather than a social music product or a general-purpose DAW.

## Operating Context

The user arrives with a song file and wants a fast, legible handoff from upload to an editable stem mix. A web UI owns the task; the inference service owns audio processing.

## Capabilities and Constraints

The production inference API is FastAPI-backed and runs the local GPU-capable HTDemucs six-stem model by default. The static interface remains buildless, exposes the API URL as a configuration point, and detects or lets visitors choose English/Korean. MP3/WAV upload, upload feedback, processing states, stem controls, WAV/MP3 download controls, and ZIP download are in scope.

## Brand Commitments

Simple, clean, DAW-inspired operating interface. The user referenced Logic as the familiar interaction benchmark, not as a visual clone.

## Evidence on Hand

No customer claims, audio samples, benchmark data, brand assets, or deployed inference endpoint were provided. Demo track data must be visibly labelled as a preview.

## Product Principles

- Make the separation workflow understandable at a glance.
- Keep mixing controls direct and reversible.
- Treat audio filenames and downloads as the primary output.
- Avoid unnecessary account, social, or marketing UI.


