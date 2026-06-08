# Desine

A font and web color scraper Chrome/Brave extension.

Desine scrapes a page to extract fonts, commonly used colors (hex), and letter-spacing statistics.

## Install For Development

1. Open Chrome and go to `chrome://extensions`.
   If using Brave, go to `brave://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `desine` folder in this repository.
4. Open a page and click the Desine toolbar button, then "Scrape Page".

## Notes

- Uses a content script to scan DOM elements and compute styles. Heavy pages may take a moment.
- This is an initial prototype. Possible improvements: handle alpha colors, detect exact font files, and extract spacing per selector.
- Need to figure out how to get colors from images used in a website without making this project huge.
- If willing to improve, please add your improvements and send a PR.

## How it would look:

<img width="3000" height="1608" alt="image" src="https://github.com/user-attachments/assets/e932d1a3-8cef-4b26-9ac9-f731e2af11ae" />

<img width="998" height="1356" alt="image" src="https://github.com/user-attachments/assets/15030c4c-d71c-4e5b-85c1-34b0fa212b69" />


