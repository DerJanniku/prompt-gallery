document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const themeToggleButton = document.getElementById('theme-toggle');
    const langToggleButton = document.getElementById('lang-toggle');
    const appTitle = document.getElementById('app-title');
    const footerText = document.getElementById('footer-text');
    let prompts = [];
    let currentLang = 'en';

    const translations = {
        en: {
            appTitle: "Prompt Gallery",
            footerText: "Made by derjannik",
            themeToggle: "Toggle Theme",
            langToggle: "Deutsch",
            promptsTitle: "All Prompts",
            backToPrompts: "Back",
            copy: "Copy",
            copied: "Copied!"
        },
        de: {
            appTitle: "Prompt Galerie",
            footerText: "Erstellt von derjannik",
            themeToggle: "Theme wechseln",
            langToggle: "English",
            promptsTitle: "Alle Prompts",
            backToPrompts: "Zurück",
            copy: "Kopieren",
            copied: "Kopiert!"
        }
    };

    const updateUIText = () => {
        const t = translations[currentLang];
        appTitle.textContent = t.appTitle;
        footerText.textContent = t.footerText;
        themeToggleButton.textContent = t.themeToggle;
        langToggleButton.textContent = t.langToggle;
    };

    const filePaths = [
        'public/prompt1.md',
        'public/prompt2.md',
        'private/prompt1.md',
        'private/prompt2.md'
    ];

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
        }
    };

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    const toggleLang = () => {
        currentLang = currentLang === 'en' ? 'de' : 'en';
        updateUIText();
        renderHomePage();
    };

    themeToggleButton.addEventListener('click', toggleTheme);
    langToggleButton.addEventListener('click', toggleLang);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    const fetchMarkdownFiles = async () => {
        for (const filePath of filePaths) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filePath}`);
                }
                const text = await response.text();
                const parsedPrompt = parseFrontmatter(text, filePath);
                prompts.push(parsedPrompt);
            } catch (error) {
                console.error(error);
            }
        }
        renderHomePage();
    };

    const parseFrontmatter = (text, filePath) => {
        const frontmatterRegex = /^---([\s\S]*?)---/;
        const match = frontmatterRegex.exec(text);
        const frontmatter = {};
        if (match) {
            const yaml = match[1];
            const lines = yaml.trim().split('\n');
            lines.forEach(line => {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                if (key.trim() === 'tags') {
                    frontmatter[key.trim()] = value.replace(/\[|\]|"/g, '').split(',').map(tag => tag.trim());
                } else {
                    frontmatter[key.trim()] = value.replace(/^['"]|['"]$/g, '');
                }
            });
        }
        const content = text.replace(frontmatterRegex, '').trim();
        return { ...frontmatter, content, filePath };
    };

    const parseMarkdown = (text) => {
        return text.replace(/\n/g, '<br>');
    };

    const renderHomePage = () => {
        const t = translations[currentLang];
        let promptsHtml = `<h2>${t.promptsTitle}</h2>`;
        promptsHtml += '<div class="prompt-grid">';
        prompts.forEach(prompt => {
            promptsHtml += `
                <div class="prompt-card" data-path="${prompt.filePath}">
                    <h3>${prompt.title}</h3>
                    <p>${prompt.description}</p>
                    <div class="tags-container">
                        ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `;
        });
        promptsHtml += '</div>';
        appContainer.innerHTML = promptsHtml;

        document.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const filePath = e.currentTarget.dataset.path;
                renderDetailView(filePath);
            });
        });
    };

    const renderDetailView = (filePath) => {
        const prompt = prompts.find(p => p.filePath === filePath);
        const t = translations[currentLang];

        let detailHtml = `
            <div class="prompt-detail-header">
                <button id="back-to-prompts">${t.backToPrompts}</button>
                <button id="copy-prompt">${t.copy}</button>
            </div>
            <div class="prompt-content">
                <h2>${prompt.title}</h2>
                <p class="prompt-description">${prompt.description}</p>
                <div class="tags-container">
                    ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="prompt-body">${parseMarkdown(prompt.content)}</div>
            </div>
        `;
        appContainer.innerHTML = detailHtml;

        document.getElementById('back-to-prompts').addEventListener('click', renderHomePage);

        const copyButton = document.getElementById('copy-prompt');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.content).then(() => {
                copyButton.textContent = t.copied;
                setTimeout(() => {
                    copyButton.textContent = t.copy;
                }, 2000);
            });
        });
    };
    updateUIText();
    fetchMarkdownFiles();
});