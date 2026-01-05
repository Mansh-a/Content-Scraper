
const healJson = (text) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("JSON parse failed. Entering Aggressive Scavenger Mode...");
        const keys = ['id', 'title', 'summary', 'description', 'author', 'url', 'image', 'imageUrl', 'thumbnail', 'published_at'];

        // Find all occurrences of known keys to use as anchors
        const anchors = [];
        keys.forEach(k => {
            let pos = 0;
            const searchStr = `"${k}":`;
            while ((pos = text.indexOf(searchStr, pos)) !== -1) {
                anchors.push({ key: k, index: pos });
                pos += searchStr.length;
            }
        });

        anchors.sort((a, b) => a.index - b.index);
        if (anchors.length === 0) throw e;

        const items = [];
        let currentItem = {};

        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            const nextAnchor = anchors[i + 1];

            // Value extraction: from the first quote after the key to the last quote before the next key
            // We need to find the start quote and end quote of the value
            const startOfValuePos = text.indexOf('"', anchor.index + anchor.key.length + 2) + 1;
            let endOfValuePos;

            if (nextAnchor) {
                // The value ends at the last quote BEFORE the next anchor
                const gap = text.substring(0, nextAnchor.index);
                endOfValuePos = gap.lastIndexOf('"');
            } else {
                // Last anchor in text
                const gap = text.trim();
                endOfValuePos = gap.lastIndexOf('"');
            }

            if (startOfValuePos > 0 && endOfValuePos > startOfValuePos) {
                const val = text.substring(startOfValuePos, endOfValuePos);

                // If this key is already in currentItem, we just encountered a new object!
                if (currentItem[anchor.key] !== undefined) {
                    items.push(currentItem);
                    currentItem = {};
                }
                currentItem[anchor.key] = val;
            }

            // Also check if there's an explicit object closing brace between anchors
            if (nextAnchor) {
                const gapBetween = text.substring(anchor.index, nextAnchor.index);
                if (gapBetween.includes('}')) {
                    // If it's a "known" close, push the item
                    // But only if we have some data
                    if (Object.keys(currentItem).length > 0) {
                        // We don't push yet if the next anchor is just another key for the CURRENT object
                        // Actually, if we see a }, it's a very strong signal of object end.
                        // However, Reddit content often has } in HTML.
                        // Let's rely more on duplicate keys or large gaps.
                    }
                }
            }
        }

        if (Object.keys(currentItem).length > 0) {
            items.push(currentItem);
        }

        if (items.length > 0) {
            return items.map(raw => {
                try {
                    // Return a clean, reconstructed object
                    const clean = {};
                    Object.entries(raw).forEach(([k, v]) => {
                        clean[k] = v;
                    });
                    return clean;
                } catch (err) {
                    return raw;
                }
            });
        }
        throw e;
    }
};

// SIMULATE THE EXACT MALFORMED DATA FROM THE USER'S TEMPLATE (concatenated, missing commas)
const simulatedResponse = `
{
  "title": "Post 1 with "nested" quotes",
  "summary": "summary 1",
  "description":"desc 1 with data"
  "author": "author 1",
  "url": "http://1",
  "image": "http://img1.jpg",
  "published_at": "date 1"
}
{
  "title": "Post 2",
  "summary": "summary 2",
  "description":"desc 2"
  "author": "author 2",
  "url": "http://2",
  "image": "http://img2.jpg",
  "published_at": "date 2"
}
`;

console.log("Input text length:", simulatedResponse.length);
const result = healJson(simulatedResponse);
console.log("Result items found:", result.length);
console.log(JSON.stringify(result, null, 2));

if (result.length === 2) {
    console.log("TEST PASSED: Multiple items extracted correctly.");
} else {
    console.log("TEST FAILED: Only found " + result.length + " items.");
}
