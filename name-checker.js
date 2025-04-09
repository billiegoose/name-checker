#!/usr/bin/env node
import logUpdate from 'log-update';

const checkHttpStatus = (res) => {
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    throw new Error(`Unexpected status ${res.status}`);
};

const name = process.argv[2];
if (!name) {
    console.error('Usage: node name-checker.js <name>');
    process.exit(1);
}

const headers = {
    'User-Agent': 'name-checker-cli/1.0 (https://github.com/billiegoose/name-checker)'
}

const services = [
    {
        label: 'GitHub (User/Org)',
        check: async (name) => {
            const res = await fetch(`https://api.github.com/users/${name}`, { headers });
            return checkHttpStatus(res);
        },
    },
    {
        label: 'PyPI',
        check: async (name) => {
            const res = await fetch(`https://pypi.org/pypi/${name}/json`, { headers });
            return checkHttpStatus(res);
        },
    },
    {
        label: 'npm',
        check: async (name) => {
            const res = await fetch(`https://registry.npmjs.org/${name}`, { headers });
            return checkHttpStatus(res);
        },
    },
    {
        label: 'crates.io',
        check: async (name) => {
            const url = `https://crates.io/api/v1/crates/${encodeURIComponent(name)}`;
            const res = await fetch(url, { headers });
            return checkHttpStatus(res);
        },
    },
    {
        label: 'Homebrew',
        check: async (name) => {
            const res = await fetch('https://formulae.brew.sh/api/formula.json');
            if (!res.ok) throw new Error('Homebrew fetch failed');
            const data = await res.json();
            return !data.some(pkg => pkg.name === name);
        },
    },
    {
        label: 'Ubuntu',
        check: async (name) => {
            const res = await fetch(`https://api.launchpad.net/1.0/ubuntu/+archive/primary?ws.op=getPublishedSources&source_name=${name}`, { headers });
            if (!res.ok) throw new Error('Ubuntu fetch failed');
            const text = await res.text();
            return text.includes('No matching') || !text.includes(name);
        },
    }
];

const results = Object.fromEntries(services.map(s => [s.label, '⏳ Checking...']));

const render = () => {
    logUpdate(Object.entries(results).map(([label, status]) => `${label}: ${status}`).join('\n'));
};

render();

await Promise.all(services.map(async ({ label, check }) => {
    try {
        const available = await check(name);
        results[label] = available ? '✅ Available' : '❌ Taken';
    } catch (e) {
        results[label] = `⚠️ Error: ${e.message}`;
    }
    render();
}));
