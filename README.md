# Crossword Puzzle Solver

A simple constraint-satisfaction (CSP) crossword puzzle solver written in Python. It finds valid word placements for a crossword grid by enforcing node and arc consistency and using backtracking search when needed.

This repository includes both a command-line solver (`generate.py`) and a small web UI (`app.py` + `start_web.bat`) for experimenting with puzzle structures and wordlists.

## Demo video

Want to see the solver in action? Add a short demo video (recommended: hosted on YouTube) and replace the placeholder below with your video ID or link.

- YouTube (recommended):

  [![Demo video placeholder](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

  Replace `VIDEO_ID` with your video's YouTube ID to show a clickable thumbnail in this README.

- To embed a local video in other documentation, place the file in `static/` and link to it from your site or README viewer (note: GitHub does not natively play local video files inside README.md).

If you'd like, I can add the real video link if you provide it (YouTube URL or file path).

## Quick overview

- Language: Python 3
- CLI solver: `generate.py`
- Core structure/model: `crossword.py`
- Web demo: `app.py`, static assets in `static/`, batch launcher `start_web.bat`
- Example data: `data/structure0.txt`, `data/words0.txt` (also 1 and 2 variants)

## Features

- Node and arc consistency enforcement for pruning possible word assignments
- Backtracking search with heuristics (MRV, least-constraining value) to complete assignments
- CLI and small web UI for visualization
- Save solved puzzles as images (requires Pillow)

## Requirements

- Python 3.8+ (3.10 recommended)
- Pillow (for saving output as images)

Install dependencies (PowerShell):

```powershell
python -m pip install -r requirements.txt
```

If you prefer installing just Pillow:

```powershell
python -m pip install pillow
```

## CLI: solve a crossword

Run the generator from the repository root.

PowerShell examples:

```powershell
# Solve and print to console
python generate.py data/structure0.txt data/words0.txt

# Solve and save to an image
python generate.py data/structure0.txt data/words0.txt output/output0.png
```

Notes:
- `structure*.txt` defines the crossword grid/slot layout used by the solver.
- `words*.txt` contains the word list to fill the slots.

## Web demo (local)

There is a lightweight web demo included. On Windows you can launch it with the provided batch file.

PowerShell run (recommended):

```powershell
.\start_web.bat
```

Or run the Flask app directly (if Flask is available):

```powershell
python app.py
```

Open a browser at http://127.0.0.1:5000 (or the port printed by the server) to use the web UI.

## Project structure (important files)

- `crossword.py` — crossword data structures and utility functions (Variable, Crossword, overlaps).
- `generate.py` — CSP solver and driver for CLI usage (`CrosswordCreator`).
- `app.py` — small Flask-based web UI (if present in this repo).
- `data/` — sample crossword structures and wordlists (`structure0.txt`, `words0.txt`, ...).
- `static/` — web static assets (css/js) used by the web demo.
- `output/` — recommended place for saved puzzle images.

## Examples

Try the provided examples in `data/`:

```powershell
python generate.py data/structure0.txt data/words0.txt
python generate.py data/structure1.txt data/words1.txt
python generate.py data/structure2.txt data/words2.txt
```

Each will print or (if given an output filename) save a solved crossword image to `output/`.

## How to add your demo video

1. Upload your demo to YouTube and copy the video ID (part after `v=` in the URL).
2. Replace `VIDEO_ID` in the Demo video section above with your video ID.

Alternatively, add a link to a hosted video in the Demo video section or create a short GIF and link/embed it.

## Contributing

Contributions welcome. Suggested small improvements:

- Add a recorded demo and replace the placeholder video ID
- Add unit tests for `crossword.py` and the constraint functions
- Improve the web UI for interactive editing and puzzle upload

When contributing, please create a branch and open a pull request.

## License

This project includes `LICENSE` and `LICENSE.txt` files in the repository root — please check those for licensing details.

## Troubleshooting

- If you see errors about missing modules, confirm you're using the correct Python interpreter and that dependencies from `requirements.txt` are installed.
- If saving images fails, ensure Pillow is installed and you have write permission to the `output/` directory.

---

If you'd like, I can:

1. Replace the README video placeholder with a real YouTube link if you provide it.
2. Add a small animated GIF in `static/` and show it in the README instead.
3. Update `README_WEB.md` similarly so the web-specific docs match.

Tell me which option you'd like and I'll update the README accordingly.
