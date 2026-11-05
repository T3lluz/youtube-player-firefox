<p align="center">
  <img src="icons/icon128.png" alt="" width="80" height="80">
</p>

<h1 align="center">YouTube Player for Twitch, for Firefox</h1>

<p align="center">
  Watch YouTube livestreams inside Twitch, with Twitch chat alongside and only the player controls on the video.
</p>

<p align="center">
  <a href="https://t3lluz.github.io/youtube-player-firefox/">Install</a> ·
  <a href="#features">Features</a> ·
  <a href="docs/usage.md">Usage guide</a> ·
  <a href="docs/development.md">Development</a>
</p>

---

This is the Firefox build of [vrnrn's YouTube Player for Twitch](https://github.com/vrnrn/youtube-player-for-twitch), which is a Chrome extension. It keeps every feature and changes one thing: the YouTube player shows only its controls.

| Shown | Hidden |
| :--- | :--- |
| Play and pause, volume, captions, settings, scrub bar, time, fullscreen | Share, watch later, More videos, the YouTube logo, video title and channel, suggested videos |

YouTube's embed has no setting for this, so `youtube-embed.css` hides those parts of the player. It applies only to the iframe this extension creates. YouTube embeds on other sites look the same as before. If YouTube renames its player elements, something hidden may reappear until the file is updated.

## Get started

1. **[Add it to Firefox](https://t3lluz.github.io/youtube-player-firefox/).** It needs Firefox 140 or newer, or a browser built on it like Zen. Mozilla signs it and it updates itself.
2. **Open a Twitch channel** and click **YPFT** on the right of the top navigation.
3. **Find your stream.** Choose **Find YouTube Stream → Use This Stream**, or paste a YouTube URL and click **Go**.

The extension pauses and mutes the underlying Twitch player. **Restore Twitch** brings it back with its original pause, mute and volume settings.

## Features

| Watch and chat | Find and customize |
| :--- | :--- |
| **YouTube playback, Twitch community**<br>Watch through YouTube's embedded player while keeping the Twitch channel interface. | **Find the live stream**<br>Checks the streamer's linked YouTube channel first, then searches by Twitch channel name with fuzzy matching and live-result filtering. |
| **Catch up to live**<br>**Sync Now** seeks toward the live edge and briefly catches up at 2× speed. Optional **Auto-sync** repeats every 10 minutes. | **Recent streams and favorites**<br>Restore playback after a reload, remember links per Twitch channel, revisit your last five streams and pin favorites. |
| **Floating chat in fullscreen**<br>Optional read-only chat over the player, with Twitch messages, badges and emotes. Move it, resize it and adjust its appearance. | **Player settings**<br>Keep Twitch at Source quality, hide Twitch player-extension overlays, and adjust extra controls in a settings window. |

**Extra emotes** from BetterTTV, FrankerFaceZ and 7TV appear in Twitch chat and floating chat. **Channels and categories** default to viewer count, highest first. **Theatre Mode** widens the player using Twitch's layout controls.

**Kick support (experimental)** is off by default under **Settings → Kick**. [Setup and limits](docs/usage.md#experimental-kick-support).

**Interruption blocking (experimental)** is off by default. It bundles the pinned TwitchAdSolutions VAFT v37.0.0 script, runs only on Twitch, and reloads the page when toggled. Turn off any other VAFT install first. [Setup and limits](docs/usage.md#experimental-interruption-blocking), [source notes](vendor/vaft/README.md).

## Privacy

Settings, history and playback state stay in the browser's local extension storage. There is no analytics or telemetry. The extension sends Twitch channel names to YouTube when you search, channel names and IDs to BetterTTV, FrankerFaceZ and 7TV for emotes, and Kick channel names to Kick if you turn that on. YouTube and Twitch handle their own requests.

## Build

Vanilla JavaScript, CSS and Manifest V3, with no npm dependencies. Node 22, `zip` and `unzip` are the only requirements.

```bash
git clone https://github.com/T3lluz/youtube-player-firefox.git
cd youtube-player-firefox
npm run check
npm run build
```

Load `build/latest/manifest.json` from `about:debugging`. The [development guide](docs/development.md) covers the source map, testing and releases. To pull upstream changes, add `https://github.com/vrnrn/youtube-player-for-twitch` as a remote and merge its `main`.

---

[MIT licensed](LICENSE), from vrnrn's original. Bundled VAFT keeps the [TwitchAdSolutions Contributors' MIT license](vendor/vaft/LICENSE). Floating chat was inspired by [Floating Twitch Chat](https://github.com/xD33m/floating_twitch_chat).
