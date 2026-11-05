// Runs in every YouTube embed frame, but only marks the iframe this extension
// created (see `ypft_controls` in twitch-content.js). youtube-embed.css does
// nothing without the mark, so YouTube embeds on other sites stay untouched.
if (new URLSearchParams(location.search).has('ypft_controls')) {
    document.documentElement.setAttribute('data-ypft-controls', '');
}
