# GTA VI Spoiler Shield AI

Manifest V3 Chrome extension for YouTube with local spoiler rules and optional server-side AI classification.

## Features
- YouTube homepage, search, recommendations and Shorts selectors.
- Early CSS concealment until card text is available and classified.
- Local detection with Relaxed, Balanced and Strict modes.
- Optional AI classification through a Vercel serverless endpoint.
- Mistral is the primary provider; Google Gemini is the backup.
- Provider keys remain server-side. If both providers fail, the verdict is UNCERTAIN.

## Deploy backend
1. Import this repository into Vercel.
2. Add MISTRAL_PRIMARY_API_KEY and GEMINI_BACKUP_API_KEY.
3. Optionally add MISTRAL_MODEL and GEMINI_MODEL.
4. Deploy. The API endpoint is /api/classify.
5. Never place provider keys in extension source code or commit real keys.

## Install extension in desktop Chrome
1. Open chrome://extensions.
2. Enable Developer mode and select Load unpacked.
3. Select this repository folder (the folder containing manifest.json).
4. Open YouTube and the extension popup.
5. Set Backend URL to your Vercel project origin, such as https://your-project.vercel.app.
6. Save settings and refresh YouTube.

## Limitations before public launch
- Verify YouTube selectors against live DOM; YouTube changes its markup often.
- document_start CSS reduces exposure but cannot guarantee zero flashes.
- This initial endpoint has no persistent user authentication or rate limiting. Add both before public launch.
- Test in desktop Chromium; Chrome Android does not provide the standard unpacked extension workflow.