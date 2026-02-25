const GITHUB_API = 'https://api.github.com';
const REPO = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN!;

const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
};

export async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return { content, sha: data.sha };
    } catch {
        return null;
    }
}

export async function updateFile(path: string, newContent: string, commitMessage: string): Promise<boolean> {
    try {
        const existing = await getFile(path);
        const encoded = Buffer.from(newContent).toString('base64');

        const body: Record<string, unknown> = {
            message: commitMessage,
            content: encoded,
            branch: BRANCH,
        };
        if (existing?.sha) body.sha = existing.sha;

        const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });

        return res.ok;
    } catch {
        return false;
    }
}

export async function getRepoStructure(): Promise<string[]> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${REPO}/git/trees/${BRANCH}?recursive=1`, { headers });
        const data = await res.json();
        return (data.tree as { path: string; type: string }[])
            .filter(f => f.type === 'blob' && (
                f.path.endsWith('.ts') ||
                f.path.endsWith('.tsx') ||
                f.path.endsWith('.css')
            ))
            .map(f => f.path);
    } catch {
        return [];
    }
}

export async function getLatestCommit(): Promise<string> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${REPO}/commits/${BRANCH}`, { headers });
        const data = await res.json();
        return data.sha?.slice(0, 7) || 'unknown';
    } catch {
        return 'unknown';
    }
}
