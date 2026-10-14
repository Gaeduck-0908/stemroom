# Contributing to Stemroom

Thanks for helping make local audio separation easier to use.

## Before opening a pull request

1. Keep changes focused and describe the user-facing outcome.
2. Run the web app and API locally, then verify the upload → separation → download flow.
3. Do not commit source audio, separated stems, model caches, or virtual environments.
4. Keep every visible string in both English and Korean by updating `apps/web/i18n.js`.

## Project conventions

- The web interface is deliberately buildless: plain HTML, CSS, and JavaScript.
- The FastAPI adapter owns local inference and download endpoints.
- Use semantic HTML, keyboard-accessible controls, and clear recovery copy for errors.
- Treat model quality claims carefully: stem separation is probabilistic and source-dependent.

## Reporting issues

Please include your operating system, Python version, GPU/CPU mode, input format, and the exact error message. Do not attach copyrighted audio unless you have permission to share it.

