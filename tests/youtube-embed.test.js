const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const root = `${__dirname}/..`;
const script = fs.readFileSync(`${root}/youtube-embed.js`, 'utf8');
const css = fs.readFileSync(`${root}/youtube-embed.css`, 'utf8');
const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`, 'utf8'));

function marked(search) {
    const attributes = new Map();
    const documentElement = { setAttribute: (name, value) => attributes.set(name, value) };
    vm.runInNewContext(script, { URLSearchParams, location: { search }, document: { documentElement } });
    return attributes.has('data-ypft-controls');
}

test('only the iframe this extension creates gets the controls filter', () => {
    assert.equal(marked('?autoplay=1&rel=0&enablejsapi=1&ypft_controls=1'), true);
    assert.equal(marked('?autoplay=1&rel=0&enablejsapi=1'), false);
    assert.equal(marked(''), false);
});

test('every filter rule needs the mark, so other sites keep their embeds', () => {
    const selectors = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^}]*\}/g, ',').split(',')
        .map(selector => selector.trim()).filter(Boolean);
    assert.ok(selectors.length > 0);
    for (const selector of selectors) assert.match(selector, /^html\[data-ypft-controls\] /);
});

test('the filter runs in YouTube embed frames before they paint', () => {
    const entry = manifest.content_scripts.find(item => item.js?.includes('youtube-embed.js'));
    assert.deepEqual(entry.matches, ['https://www.youtube.com/embed/*']);
    assert.deepEqual(entry.css, ['youtube-embed.css']);
    assert.equal(entry.all_frames, true);
    assert.equal(entry.run_at, 'document_start');
});

test('the manifest is the Firefox one', () => {
    const { gecko } = manifest.browser_specific_settings;
    assert.equal(gecko.id, 'youtube-player-for-twitch@t3lluz.com');
    assert.match(gecko.update_url, /^https:\/\/t3lluz\.github\.io\/youtube-player-firefox\//);
    assert.deepEqual(manifest.background, { scripts: ['background.js'] });
});
