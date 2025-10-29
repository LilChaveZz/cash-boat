// js/educacion.js

// Use an absolute path so pages inside /educacion/ can still fetch the manifest
const EDUCATION_DATA_PATH = '/data/educacion.json';
const educationGrid = document.getElementById('education-grid');

/**
 * Fetches education data from the JSON file.
 * @returns {Promise<Array>} Array of education articles/videos.
 */
async function fetchEducationData() {
    try {
        const response = await fetch(EDUCATION_DATA_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Could not fetch education data:", e);
        if (educationGrid) {
            educationGrid.innerHTML = `<p class="error-message" style="text-align: center;">Error al cargar el contenido educativo. Inténtalo de nuevo más tarde.</p>`;
        }
        return [];
    }
}

/**
 * Creates the HTML for a single education card.
 * @param {Object} item - The education item data.
 * @returns {string} The HTML string for the card.
 */
function createCardHTML(item) {
    const icon = item.type === 'video' ? '▶️' : '📝';
    const typeText = item.type === 'video' ? 'Video' : 'Artículo';
    const articlePath = `educacion/${item.slug}.html`;

    return `
        <a href="${articlePath}" class="card-link">
            <div class="education-card">
                <div class="card-image-container">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="card-overlay">
                        <div class="card-content">
                            <h3>${item.title}</h3>
                            <span class="card-type">${typeText} <span class="card-type-icon">${icon}</span></span>
                        </div>
                    </div>
                </div>
                <div class="card-excerpt">
                    <p>${item.excerpt}</p>
                </div>
                <div class="card-footer">
                    <span class="ver-mas">Ver más &rarr;</span>
                </div>
            </div>
        </a>
    `;
}

/**
 * Renders all education cards to the grid.
 */
async function renderEducationGrid() {
    if (!educationGrid) return;
    const data = await fetchEducationData();

    if (data.length === 0) {
        educationGrid.innerHTML = `<p style="text-align: center; color: #888;">No hay contenido disponible en este momento.</p>`;
        return;
    }

    const cardsHtml = data.map(createCardHTML).join('');
    educationGrid.innerHTML = cardsHtml;
}

/**
 * Renders a single article page based on the slug in the URL.
 */
async function renderArticlePage() {
    const data = await fetchEducationData();
    const urlParts = window.location.pathname.split('/');
    const slugHtml = urlParts[urlParts.length - 1];
    const slug = slugHtml.replace('.html', '');

    const article = data.find(item => item.slug === slug);

    if (!article) {
        document.body.innerHTML = `
            <div class="article-container">
                <p class="error-message">Artículo no encontrado.</p>
                <a href="../educacion.html">Volver a Educación</a>
            </div>
        `;
        return;
    }

    document.title = `CashBoat - ${article.title}`;
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-meta').innerHTML = `Por ${article.author} | Publicado el ${article.date}`;
    document.getElementById('article-image').src = `../${article.image}`;

    // The JSON 'content' field may contain Markdown-like markers (e.g. **bold**)
    // stored inside a string. If content includes Markdown tokens, convert a
    // small subset (bold, italic, inline code) to HTML so it renders correctly.
    function convertSimpleMarkdownToHtml(text) {
        if (!text || typeof text !== 'string') return '';
        // Convert code spans: `code`
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Convert bold: **bold**
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Convert italic: *italic* (avoid changing already converted **)
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return text;
    }

    document.getElementById('article-content').innerHTML = convertSimpleMarkdownToHtml(article.content);
}


// Check if we are on the main education page or an article page
if (window.location.pathname.endsWith('educacion.html')) {
    document.addEventListener('DOMContentLoaded', renderEducationGrid);
} else if (window.location.pathname.includes('educacion/')) {
    document.addEventListener('DOMContentLoaded', renderArticlePage);
}
