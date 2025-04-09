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
            label: 'Ubuntu (Packages)',
            check: async (name) => {
                try {
                    // Try packages.ubuntu.com search results page
                    const res = await fetch(`https://packages.ubuntu.com/search?keywords=${encodeURIComponent(name)}&searchon=names&suite=all&section=all`);
                    if (!res.ok) throw new Error('Ubuntu packages fetch failed');
                    const text = await res.text();
                    // If the package exists, the page will contain specific text patterns
                    return !text.includes(`<h1>Package ${name}</h1>`) && !text.includes(`>Package ${name}<`);
                } catch (e) {
                    console.error(`Ubuntu packages check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Debian (Packages)',
            check: async (name) => {
                try {
                    // Try packages.debian.org search results page
                    const res = await fetch(`https://packages.debian.org/search?keywords=${encodeURIComponent(name)}&searchon=names&suite=stable&section=all`);
                    if (!res.ok) throw new Error('Debian packages fetch failed');
                    const text = await res.text();
                    // If the package exists, the page will contain specific text patterns
                    return !text.includes(`<h1>Package ${name}</h1>`) && !text.includes(`>Package ${name}<`);
                } catch (e) {
                    console.error(`Debian packages check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Ubuntu (Launchpad)',
            check: async (name) => {
                try {
                    // Try an alternative endpoint for Launchpad API
                    const res = await fetch(`https://api.launchpad.net/devel/ubuntu/+archive/primary?ws.op=getPublishedSources&source_name=${encodeURIComponent(name)}`);
                    if (!res.ok) throw new Error('Launchpad API fetch failed');
                    const text = await res.text();
                    return text.includes('No matching') || !text.includes(name);
                } catch (e) {
                    console.error(`Ubuntu Launchpad check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        // Additional Programming Language Package Managers
        {
            label: 'RubyGems',
            check: async (name) => {
                try {
                    const res = await fetch(`https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json`);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`RubyGems check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Maven Central',
            check: async (name) => {
                try {
                    const res = await fetch(`https://search.maven.org/solrsearch/select?q=a:${encodeURIComponent(name)}`);
                    if (!res.ok) throw new Error('Maven Central fetch failed');
                    const data = await res.json();
                    return data.response.numFound === 0;
                } catch (e) {
                    console.error(`Maven Central check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'NuGet',
            check: async (name) => {
                try {
                    const res = await fetch(`https://api.nuget.org/v3/registration5-semver1/${encodeURIComponent(name.toLowerCase())}/index.json`);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`NuGet check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'CPAN (Perl)',
            check: async (name) => {
                try {
                    const res = await fetch(`https://fastapi.metacpan.org/v1/module/${encodeURIComponent(name)}`);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`CPAN check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Packagist (PHP)',
            check: async (name) => {
                try {
                    // Packagist expects package names in format vendor/package
                    // For single name checks, we'll check if it exists as any package
                    const res = await fetch(`https://packagist.org/search.json?q=${encodeURIComponent(name)}`);
                    if (!res.ok) throw new Error('Packagist fetch failed');
                    const data = await res.json();
                    // Check if there's an exact match in the results
                    return !data.results.some(pkg =>
                        pkg.name === name ||
                        pkg.name.endsWith(`/${name}`) ||
                        pkg.name.startsWith(`${name}/`)
                    );
                } catch (e) {
                    console.error(`Packagist check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Go Modules',
            check: async (name) => {
                try {
                    const res = await fetch(`https://pkg.go.dev/${encodeURIComponent(name)}`);
                    // If redirected to a 404 page, it's available
                    if (res.url.includes('/404')) return true;
                    // If status is 200 and not a 404 page, it's taken
                    if (res.status === 200) return false;
                    // Otherwise, check status code
                    return res.status === 404;
                } catch (e) {
                    console.error(`Go Modules check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Julia Registry',
            check: async (name) => {
                try {
                    const res = await fetch(`https://juliahub.com/ui/Packages/${encodeURIComponent(name)}/`);
                    // Check if we get a 404 or a page with "no packages found"
                    if (res.status === 404) return true;
                    if (res.status === 200) {
                        const text = await res.text();
                        return text.includes('No packages found');
                    }
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`Julia Registry check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
                    return null;
                }
            },
        },
        {
            label: 'Dart/Flutter Pub',
            check: async (name) => {
                try {
                    const res = await fetch(`https://pub.dev/api/packages/${encodeURIComponent(name)}`);
                    return checkHttpStatus(res);
                } catch (e) {
                    console.error(`Dart/Flutter Pub check failed: ${e.message}`);
                    console.error('This may be due to CORS restrictions');
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
