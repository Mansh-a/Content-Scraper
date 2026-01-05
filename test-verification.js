
// Mock of the logic in dataService.ts
const isValidDate = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
};

const scavengeImage = (item) => {
    const candidates = ['image', 'imageUrl', 'thumbnail', 'pic', 'url_overridden_by_dest', 'preview', 'media_url'];
    for (const f of candidates) {
        const val = item[f];
        if (typeof val === 'string' && val.trim().startsWith('http')) {
            return val.trim();
        }
    }
    return '';
};

const extractItemsFromText = (text) => {
    const keys = ['id', 'title', 'summary', 'description', 'author', 'url', 'image', 'imageUrl', 'thumbnail', 'published_at', 'dateCreated'];
    const hits = [];

    keys.forEach(k => {
        let pos = 0;
        const searchStr = `"${k}":`;
        while ((pos = text.indexOf(searchStr, pos)) !== -1) {
            const startVal = text.indexOf('"', pos + k.length + 2) + 1;
            if (startVal > 0) {
                const nextKeyIdxs = keys.map(k2 => text.indexOf(`"${k2}":`, startVal)).filter(idx => idx !== -1);
                const minNext = nextKeyIdxs.length > 0 ? Math.min(...nextKeyIdxs) : text.length;
                const segment = text.substring(0, minNext);
                const endVal = segment.lastIndexOf('"');
                if (endVal > startVal) {
                    hits.push({ key: k, idx: pos, val: text.substring(startVal, endVal) });
                }
            }
            pos += searchStr.length;
        }
    });

    hits.sort((a, b) => a.idx - b.idx);
    if (hits.length === 0) return [];

    const rawItems = [];
    let currentItem = {};

    hits.forEach((hit, i) => {
        const isDuplicateKey = currentItem[hit.key] !== undefined;
        // Adjusted threshold for object splitting
        const isNewTitle = hit.key === 'title' && Object.keys(currentItem).length > 3;

        if (isDuplicateKey || isNewTitle) {
            rawItems.push(currentItem);
            currentItem = {};
        }
        currentItem[hit.key] = hit.val;
    });
    if (Object.keys(currentItem).length > 0) rawItems.push(currentItem);

    const finalItems = [];
    rawItems.forEach(raw => {
        const title = raw.title || '';
        const content = raw.description || raw.summary || raw.content || '';

        if (title.length < 5 || (content.length < 20 && !raw.url)) return;
        if (title === 'Untitled Post' || title.includes('"source"')) return;

        const date = raw.published_at || raw.dateCreated;
        const timestamp = isValidDate(date) ? new Date(date).toISOString() : new Date().toISOString();

        finalItems.push({
            id: raw.id || Math.random().toString(36).substr(2, 9),
            title: title.trim(),
            content: content.trim(),
            sourceName: (raw.author || 'Scraped Source').replace(/",.source"/g, '').trim(),
            timestamp: timestamp,
            imageUrl: scavengeImage(raw)
        });
    });

    return finalItems;
};

// THE 6-ITEM MALFORMED PAYLOAD (Crashed together, missing commas)
const payload = `
{
  "title": "Title 1", "description": "some content here 1234567890", "author": "auth1", "dateCreated": "2026-01-01"
}
{
  "title": "Title 2", "description": "some content here 1234567890", "author": "auth2", "dateCreated": "2026-01-01"
}
{
  "title": "Title 3", "description": "some content here 1234567890", "author": "auth3", "dateCreated": "2026-01-01"
}
{
  "title": "Title 4", "description": "some content here 1234567890", "author": "auth4", "dateCreated": "2026-01-01"
}
{
  "title": "Title 5", "description": "some content here 1234567890", "author": "auth5", "dateCreated": "2026-01-01"
}
{
  "title": "Title 6", "description": "some content here 1234567890", "author": "auth6", "dateCreated": "2026-01-01"
}
`;

const result = extractItemsFromText(payload);
console.log("Found items:", result.length);
if (result.length === 6) {
    console.log("SUCCESS: Correct number of items found.");
} else {
    console.log("FAILURE: Found " + result.length + " instead of 6.");
}
console.log(JSON.stringify(result[0], null, 2));
