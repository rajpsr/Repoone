window.addEventListener('load', () => {
    // 1. Verify that ScriptRunner's Adaptavist Bridge exists in the iframe
    if (window.AdaptavistBridge) {
        // 2. Fetch the metadata context of the active Jira screen
        const context = window.AdaptavistBridge.getContext();
        const issueKey = context.issueKey;

        if (issueKey) {
            fetchConfluencePages(issueKey);
        } else {
            showError("Could not retrieve Jira Issue context.");
        }
    } else {
        showError("Adaptavist Bridge library failed to initialize.");
    }
});

function fetchConfluencePages(issueKey) {
    // 3. Define your target Confluence URL and search string (CQL)
    // This looks for any page containing the exact Jira issue key (e.g., 'PROJ-123')
    const confluenceDomain = "https://rajupsr.atlassian.net"; // CHANGE TO YOUR INSTANCE
    const cqlQuery = `text ~ "${issueKey}"`;
    const searchUrl = `${confluenceDomain}/wiki/rest/api/content/search?cql=${encodeURIComponent(cqlQuery)}`;

    // 4. Perform the API call via the active browser session
    // Note: This relies on the user already being logged into the Confluence instance in their browser
    fetch(searchUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const listElement = document.getElementById('pages-list');
        document.getElementById('loading').style.display = 'none';

        if (data.results && data.results.length > 0) {
            data.results.forEach(page => {
                const li = document.createElement('li');
                const fullUrl = `${confluenceDomain}/wiki${page._links.webui}`;
                
                li.innerHTML = `<a href="${fullUrl}" target="_blank">📄 ${escapeHtml(page.title)}</a>`;
                listElement.appendChild(li);
            });
        } else {
            listElement.innerHTML = '<li class="status-msg">No matching Confluence docs found for this issue.</li>';
        }
    })
    .catch(err => {
        console.error("Confluence API Error:", err);
        showError("Unable to reach Confluence or session expired.");
    });
}

function showError(message) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.color = '#DE350B';
    loadingDiv.innerText = message;
}

// Helper function to prevent XSS issues when rendering page titles
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
