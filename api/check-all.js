// Serverless function to handle all CORS-restricted checks
export default async function handler(req, res) {
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get the name parameter from the query
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: 'Name parameter is required' });
    }

    // Initialize results object
    const results = {};

    // Run all checks in parallel
    try {
        const [ubuntuResult, mavenResult, goResult, juliaResult, dartResult] = await Promise.all([
            checkUbuntu(name),
            checkMaven(name),
            checkGo(name),
            checkJulia(name),
            checkDart(name)
        ]);

        // Combine all results
        results.ubuntu = ubuntuResult;
        results.maven = mavenResult;
        results.go = goResult;
        results.julia = juliaResult;
        results.dart = dartResult;

        return res.status(200).json(results);
    } catch (error) {
        console.error('Error checking services:', error);
        return res.status(500).json({ error: error.message });
    }
}

// Helper function to check HTTP status
function checkHttpStatus(res) {
    if (res.status === 404) return { available: true };
    if (res.status === 200) return { available: false };
    return { error: `Unexpected status ${res.status}` };
}

// Ubuntu check
async function checkUbuntu(name) {
    try {
        const res = await fetch(`https://packages.ubuntu.com/search?keywords=${encodeURIComponent(name)}&searchon=names&suite=all&section=all`);
        if (!res.ok) throw new Error('Ubuntu packages fetch failed');
        const text = await res.text();
        return { available: !text.includes(`<h1>Package ${name}</h1>`) && !text.includes(`>Package ${name}<`) };
    } catch (error) {
        console.error(`Ubuntu check failed: ${error.message}`);
        return { error: error.message };
    }
}

// Maven Central check
async function checkMaven(name) {
    try {
        const res = await fetch(`https://search.maven.org/solrsearch/select?q=a:${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error('Maven Central fetch failed');
        const data = await res.json();
        return { available: data.response.numFound === 0 };
    } catch (error) {
        console.error(`Maven check failed: ${error.message}`);
        return { error: error.message };
    }
}

// Go Modules check
async function checkGo(name) {
    try {
        const res = await fetch(`https://pkg.go.dev/${encodeURIComponent(name)}`);
        if (res.url.includes('/404')) return { available: true };
        if (res.status === 200) return { available: false };
        return { available: res.status === 404 };
    } catch (error) {
        console.error(`Go check failed: ${error.message}`);
        return { error: error.message };
    }
}

// Julia Registry check
async function checkJulia(name) {
    try {
        const res = await fetch(`https://juliahub.com/ui/Packages/${encodeURIComponent(name)}/`);
        if (res.status === 404) return { available: true };
        if (res.status === 200) {
            const text = await res.text();
            return { available: text.includes('No packages found') };
        }
        return checkHttpStatus(res);
    } catch (error) {
        console.error(`Julia check failed: ${error.message}`);
        return { error: error.message };
    }
}

// Dart/Flutter Pub check
async function checkDart(name) {
    try {
        const res = await fetch(`https://pub.dev/api/packages/${encodeURIComponent(name)}`);
        return checkHttpStatus(res);
    } catch (error) {
        console.error(`Dart check failed: ${error.message}`);
        return { error: error.message };
    }
}
