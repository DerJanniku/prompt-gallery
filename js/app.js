document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const themeToggleButton = document.getElementById('theme-toggle');
    let prompts = [];
    let currentTag = null;

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

    themeToggleButton.addEventListener('click', toggleTheme);

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
        currentTag = null;
        const allTags = prompts.flatMap(prompt => prompt.tags);
        const uniqueTags = [...new Set(allTags)].sort();

        let tagsHtml = '<h2>Tags</h2><div class="tags-container">';
        uniqueTags.forEach(tag => {
            tagsHtml += `<button class="tag-button" data-tag="${tag}">${tag}</button>`;
        });
        tagsHtml += '</div>';
        appContainer.innerHTML = tagsHtml;

        document.querySelectorAll('.tag-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedTag = e.target.dataset.tag;
                renderFilterView(selectedTag);
            });
        });
    };

    const renderFilterView = (tag) => {
        currentTag = tag;
        const filteredPrompts = prompts.filter(prompt => prompt.tags.includes(tag));

        let promptsHtml = `<h2>Prompts tagged with "${tag}"</h2>`;
        promptsHtml += `<button id="back-to-tags">Back to Tags</button>`;
        promptsHtml += '<ul class="prompt-list">';
        filteredPrompts.forEach(prompt => {
            promptsHtml += `<li class="prompt-item" data-path="${prompt.filePath}">${prompt.title}</li>`;
        });
        promptsHtml += '</ul>';
        appContainer.innerHTML = promptsHtml;

        document.getElementById('back-to-tags').addEventListener('click', renderHomePage);

        document.querySelectorAll('.prompt-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const filePath = e.target.dataset.path;
                renderDetailView(filePath);
            });
        });
    };

    const renderDetailView = (filePath) => {
        const prompt = prompts.find(p => p.filePath === filePath);

        let detailHtml = `
            <div class="prompt-detail-header">
                <button id="back-to-prompts">Back</button>
                <button id="copy-prompt">Copy</button>
            </div>
            <div class="prompt-content">
                <h2>${prompt.title}</h2>
                <p class="prompt-description">${prompt.description}</p>
                <div class="prompt-body">${parseMarkdown(prompt.content)}</div>
            </div>
        `;
        appContainer.innerHTML = detailHtml;

        document.getElementById('back-to-prompts').addEventListener('click', () => {
            if (currentTag) {
                renderFilterView(currentTag);
            } else {
                renderHomePage();
            }
        });

        const copyButton = document.getElementById('copy-prompt');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.content).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            });
        });
    };

    fetchMarkdownFiles();
});