# BitMan Chrome Extension

Select text that includes a multiple-choice quiz question + options. A floating 🤖 button appears. Click it to open the BitMan panel and query OpenAI & Gemini. Answers are constrained to the detected options.

## Features
- Detect selected question + MCQ options (A-D, 1-4)
- Floating action button
- Panel with editable question
- Parallel requests to OpenAI & Gemini (temperature 0)
- Sanitizes responses to one of the provided options
- Popup & Options pages to store API keys and model names (stored in `chrome.storage.sync`)

## IMPORTANT: Add Your Own API Keys
For security, do NOT hardcode keys in code. Use the popup or options page. Keys never leave your browser except to call provider APIs.

## Installation (Developer Mode)
1. `git clone` (or copy) this folder.
2. Open Chrome > Extensions > Enable Developer Mode.
3. Load Unpacked > select the `BitMan` folder.
4. Open extension popup, enter API keys & models, Save.
5. Select a quiz question + its options on any webpage, click 🤖.

## Security Notes
- Keys are stored in sync storage (encrypted at rest per Chrome). Consider adding an optional passphrase or local encryption for stronger security if distributing widely.
- Avoid sharing builds that include any real API keys.

## Future Enhancements
- Add caching of previous questions
- Option to show reasoning (toggle) while still constraining final answer
- Support more providers (Claude, Mistral)
- Smarter option parsing (roman numerals, bullet symbols)

## License
MIT (add a `LICENSE` file if distributing)
