# Development guide

[← Back to the project](../README.md)

## Load the extension locally

1. Clone or download this repository:

   ```bash
   git clone https://github.com/T3lluz/youtube-player-firefox.git
   cd youtube-player-firefox
   ```

2. Run `npm run build` to create the unpacked extension.
3. Open `about:debugging#/runtime/this-firefox` in Firefox 140 or newer.
4. Click **Load Temporary Add-on**.
5. Select `build/latest/manifest.json` inside the repository.
6. Open or reload a Twitch channel and use **YPFT** in the top navigation.

The local dev build always stays at `build/latest`. After changing extension code, run `npm run build` again, click **Reload** in `about:debugging`, and reload Twitch. Firefox caches parsed manifests by add-on id and version, so after changing `manifest.json` use a fresh profile if a new content script does not load.

## Test and build

Use Node.js 22, matching GitHub Actions. The project uses Node's built-in test runner and has no npm dependencies to install. The build also requires `sh`, `zip` and `unzip`.

```bash
npm run check
npm run build
npm run profile:memory
```

The build replaces and validates `release.zip` in the repository root, then clears `build/` and creates the unpacked dev build at `build/latest`. Only the latest build is kept; no versioned folders or old packages are retained. Both outputs contain only runtime code, manifest icons, and license notices, and every file is checked against the source. Reserve `build/` for generated output and make code changes in the repository source. Generated build outputs are ignored by Git. The build also checks that the bundled VAFT adapter matches its pinned, reviewed source. Building does not publish or submit the extension.

After reviewing an adapter change, regenerate it offline with:

```bash
node scripts/prepare-vaft.mjs
```

Automated tests cover extension logic and build tooling. They do not establish live Twitch/YouTube behavior. Use the [theatre-mode verification notes](theatre-mode-qa.md), [floating-chat checklist](floating-chat-qa.md) and [VAFT checklist](vaft-qa.md) for the relevant browser checks.

See the [global-emote, sorting and navigation verification notes](global-emotes-and-sorting-qa.md) for the current feature checks and installation limits.

The [memory verification notes](memory-qa.md) describe retention limits and the
synthetic heap profile. This profile measures extension code in a DOM fixture;
it does not measure Twitch or YouTube video memory.

See the [settings-window verification notes](settings-window-qa.md) for modal
layout, keyboard behavior and lifecycle checks.

## Source map

| File | Responsibility |
| :--- | :--- |
| [`manifest.json`](../manifest.json) | Manifest V3 configuration, permissions and content-script order. |
| [`background.js`](../background.js) | YouTube search, public Kick channel status, cached emote catalogs and optional VAFT script registration. |
| [`twitch-content.js`](../twitch-content.js) | Navigation menu, stream discovery, YouTube iframe, history and sync controls. |
| [`twitch-playback.js`](../twitch-playback.js) | Twitch playback ownership and pause, mute and volume restoration. |
| [`twitch-directory.js`](../twitch-directory.js) | Default viewer-count sorting for channels and categories. |
| [`twitch-emotes.js`](../twitch-emotes.js) | Global and channel third-party emotes in native and floating chat. |
| [`twitch-chat.js`](../twitch-chat.js) | Floating chat, appearance settings and fullscreen coordination. |
| [`kick-support.js`](../kick-support.js) | Experimental Kick settings, sidebar pins, stream/chat embeds and local pseudo channels. |
| [`twitch-styles.css`](../twitch-styles.css) | Extension menu, player and chat styling. |
| [`vendor/vaft/`](../vendor/vaft/) and [`vaft-main.js`](../vaft-main.js) | Pinned upstream VAFT and its generated integration adapter. |
| [`tests/`](../tests/) and [`scripts/`](../scripts/) | Automated verification and release packaging. |
| [`youtube-embed.js`](../youtube-embed.js) and [`youtube-embed.css`](../youtube-embed.css) | Hide everything but the player controls in the embed this extension creates. |
| [`site/`](../site/) | The install page. |

The YouTube iframe keeps playback in YouTube's embedded player. The content scripts manage the surrounding Twitch page, and the background script handles cross-origin search requests.

## Releases

Pushing to `main` runs [`pages.yml`](../.github/workflows/pages.yml): checks, build, Mozilla's linter, signing on AMO as an unlisted add-on (`scripts/sign-firefox.mjs`, secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`), then a GitHub Pages deploy of the install page, the signed `.xpi` and `updates.json`. Installed copies update from `updates.json`.

AMO accepts each version once. To ship an update, bump the version in `manifest.json` and `package.json`, then push.
