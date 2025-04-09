/**
 * Browser-compatible version of name-checker to test CORS
 * Usage in browser console: checkName('your-name-here')
 */

const checkHttpStatus = (res) => {
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    throw new Error(`Unexpected status ${res.status}`);
};

const checkName = async (name) => {
    if (!name) {
        console.error('Usage: checkName("your-name-here")');
        return;
    }

    console.log(`Checking availability for name: ${name}`);

    const headers = {
        'User-Agent': 'name-checker-browser/1.0'
    };

    const services = [
        {
            label: 'GitHub (User/Org)',
            check: async (name) => {
                try {
                    const res = await fetch(`https://api.github.com/users/${name}`, { headers });
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`GitHub check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'PyPI',
            check: async (name) => {
                try {
                    const res = await fetch(`https://pypi.org/pypi/${name}/json`);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`PyPI check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'npm',
            check: async (name) => {
                try {
                    const res = await fetch(`https://registry.npmjs.org/${name}`);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`npm check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'crates.io',
            check: async (name) => {
                try {
                    const url = `https://crates.io/api/v1/crates/${encodeURIComponent(name)}`;
                    const res = await fetch(url);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`crates.io check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Homebrew',
            check: async (name) => {
                try {
                    const res = await fetch('https://formulae.brew.sh/api/formula.json');
                    if (!res.ok) throw new Error('Homebrew fetch failed');
                    const data = await res.json();
                    return !data.some(pkg => pkg.name === name);
                } catch (e) {
                    console.error(`Homebrew check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Ubuntu',
            check: async (name) => {
                try {
                    // Ubuntu's Launchpad API has CORS restrictions
                    // Instead of failing silently, we'll explicitly mark it as having CORS issues
                    console.error(`Ubuntu check failed: CORS restrictions prevent direct browser access`);
                    console.error('The Ubuntu package repository cannot be checked from a browser due to CORS policy');
                    return null;
                } catch (e) {
                    console.error(`Ubuntu check failed: ${e.message}`);
                    return null;
                }
            },
        }
    ];

    // Process each service sequentially to make logs easier to read
    for (const { label, check } of services) {
        console.log(`Checking ${label}...`);
        try {
            const available = await check(name);
            if (available === null) {
                console.log(`${label}: ❌ CORS Error`);
            } else {
                console.log(`${label}: ${available ? '✅ Available' : '❌ Taken'}`);
            }
        } catch (e) {
            console.log(`${label}: ⚠️ Error: ${e.message}`);
        }
    }

    console.log('All checks completed. Any CORS errors are listed above.');
};

// Export for use in browser or as a module
if (typeof window !== 'undefined') {
    window.checkName = checkName;
    console.log('Name checker loaded. Use checkName("your-name-here") to check name availability.');
}

// Allow usage as a module
if (typeof module !== 'undefined') {
    module.exports = { checkName };
}
