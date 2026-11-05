/**
 * Gets release.zip signed by addons.mozilla.org as an unlisted add-on, because
 * release Firefox installs nothing unsigned. Mozilla signs it, and it is offered
 * from this repo's GitHub Pages site instead of the add-ons store.
 *
 * Writes the site to dist/site: the install page, the signed .xpi and the
 * updates.json that Firefox polls through the manifest's update_url.
 *
 * AMO accepts each version once. If this version is already there, this
 * downloads its signed file, so CI can run on every push. Ship an update by
 * bumping the version in manifest.json and package.json.
 *
 * Needs AMO_JWT_ISSUER and AMO_JWT_SECRET, an API key from
 * https://addons.mozilla.org/developers/addon/api/key/
 * Run after npm run build.
 */
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API = 'https://addons.mozilla.org/api/v5';
const WAIT_MS = 20 * 60 * 1000;
const XPI = 'youtube-player-firefox.xpi';
const file = path => fileURLToPath(new URL(`../${path}`, import.meta.url));

const manifest = JSON.parse(readFileSync(file('manifest.json'), 'utf8'));
const { version } = manifest;
const { id, update_url: updateUrl } = manifest.browser_specific_settings.gecko;
const addon = `/addons/addon/${encodeURIComponent(id)}`;
const sleep = ms => new Promise(done => setTimeout(done, ms));

function token() {
    const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const iat = Math.floor(Date.now() / 1000);
    const body = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ iss: process.env.AMO_JWT_ISSUER, jti: randomUUID(), iat, exp: iat + 60 })}`;
    return `${body}.${createHmac('sha256', process.env.AMO_JWT_SECRET).update(body).digest('base64url')}`;
}

/** One API call. A GET that finds nothing returns null, and a 429 waits as long as Mozilla asks. */
async function amo(method, path, body) {
    for (;;) {
        const res = await fetch(path.startsWith('https:') ? path : API + path, {
            method,
            headers: {
                Authorization: `JWT ${token()}`,
                ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
            },
            body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
        });
        if (res.status === 429) {
            const wait = Number(res.headers.get('retry-after')) || 60;
            console.log(`Mozilla asks to wait ${wait}s`);
            await sleep((wait + 2) * 1000);
            continue;
        }
        if (res.status === 404 && method === 'GET') return null;
        if (!res.ok) throw new Error(`AMO ${method} ${path}: ${res.status} ${(await res.text()).slice(0, 500)}`);
        return res;
    }
}

async function until(what, check) {
    const end = Date.now() + WAIT_MS;
    for (;;) {
        const result = await check();
        if (result) return result;
        if (Date.now() > end) throw new Error(`gave up waiting for ${what}`);
        await sleep(10_000);
    }
}

async function findVersion() {
    const res = await amo('GET', `${addon}/versions/?filter=all_with_unlisted&page_size=50`);
    if (!res) return null; // The add-on does not exist yet.
    return (await res.json()).results.find(item => item.version === version) ?? null;
}

async function submit() {
    const form = new FormData();
    form.append('upload', new Blob([readFileSync(file('release.zip'))]), `${XPI.replace('.xpi', '')}-${version}.xpi`);
    form.append('channel', 'unlisted');
    const { uuid } = await (await amo('POST', '/addons/upload/', form)).json();
    const upload = await until('validation', async () => {
        const state = await (await amo('GET', `/addons/upload/${uuid}/`)).json();
        return state.processed ? state : null;
    });
    if (!upload.valid) {
        const errors = (upload.validation?.messages ?? []).filter(item => item.type === 'error').map(item => `${item.message} ${item.file ?? ''}`.trim());
        throw new Error(`validation failed: ${errors.join('; ') || 'see AMO'}`);
    }
    // Creates the add-on under its id the first time and adds a version after that.
    await amo('PUT', `${addon}/`, { version: { upload: uuid } });
}

if (!process.env.AMO_JWT_ISSUER || !process.env.AMO_JWT_SECRET) throw new Error('AMO_JWT_ISSUER and AMO_JWT_SECRET are not set');

if (await findVersion()) console.log(`v${version} is already on AMO`);
else {
    console.log(`Uploading v${version}`);
    await submit();
}
const signed = await until('signing', async () => {
    const found = await findVersion();
    if (found?.file?.status === 'disabled') throw new Error(`Mozilla refused v${version}`);
    return found?.file?.status === 'public' ? found.file : null;
});
const xpi = Buffer.from(await (await amo('GET', signed.url)).arrayBuffer());

mkdirSync(file('dist/site'), { recursive: true });
copyFileSync(file('site/index.html'), file('dist/site/index.html'));
writeFileSync(file(`dist/site/${XPI}`), xpi);
writeFileSync(file('dist/site/updates.json'), `${JSON.stringify({
    addons: {
        [id]: {
            updates: [{
                version,
                update_link: `${new URL(XPI, updateUrl)}?v=${version}`,
                update_hash: `sha256:${createHash('sha256').update(xpi).digest('hex')}`
            }]
        }
    }
}, null, 2)}\n`);
console.log(`Signed v${version}: dist/site/${XPI}`);
