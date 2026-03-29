# Draw.io Sources

Editable source for the phase 2 diagrams:
- `mental-diary.drawio`

## Install Draw.io on Windows

Use `winget`:

```powershell
winget install --id JGraph.Draw -e --accept-package-agreements --accept-source-agreements
```

## Open the diagram file

- Open `mental-diary.drawio` in draw.io / diagrams.net Desktop.
- Or open it in the web app after uploading to Google Drive / OneDrive.

## Export for the report

For best compatibility in Google Docs and Word, export each page as PNG or export the whole file as PDF.

Recommended workflow:
1. Edit the diagram in `mental-diary.drawio`.
2. Export each page to PNG if you need images inside Google Docs or DOCX.
3. Keep `mental-diary.drawio` as the editable master file.

Example export command for a single page on Windows:

```powershell
& 'C:\Program Files\draw.io\draw.io.exe' 'c:\Seva\GitHub\TSU_TASKS\Introduction to Software Engineering\phase2\diagrams\drawio\mental-diary.drawio' -x -f png -p 1 -o 'c:\Seva\GitHub\TSU_TASKS\Introduction to Software Engineering\phase2\diagrams\png\diagram-01.png'
```

To build the Word version of the report, use the PNG-linked temporary Markdown file and Pandoc.

## Notes

- The SVG files in the parent `diagrams` folder are still used by the Markdown report.
- The PNG files in `diagrams/png` are used for the DOCX export.
- The `.drawio` file is the editable source for the same diagrams.
