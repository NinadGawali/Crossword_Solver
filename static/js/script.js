// ============================================
// GLOBAL STATE
// ============================================
let currentView = 'grid'; // 'grid' or 'image'
let currentImageData = null;
let currentSessionId = null;
let solvingInterval = null;
let solvingStats = {
    attempts: 0,
    backtracks: 0,
    placements: 0
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    form: document.getElementById('crosswordForm'),
    structureSelect: document.getElementById('structure'),
    wordsSelect: document.getElementById('words'),
    generateBtn: document.getElementById('generateBtn'),
    structurePreview: document.getElementById('structurePreview'),
    wordsPreview: document.getElementById('wordsPreview'),
    placeholder: document.getElementById('placeholder'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    resultDisplay: document.getElementById('resultDisplay'),
    crosswordGrid: document.getElementById('crosswordGrid'),
    crosswordImage: document.getElementById('crosswordImage'),
    gridView: document.getElementById('gridView'),
    imageView: document.getElementById('imageView'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    viewToggleIcon: document.getElementById('viewToggleIcon'),
    viewToggleText: document.getElementById('viewToggleText')
};

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Form submission
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Preview updates
    elements.structureSelect.addEventListener('change', handleStructureChange);
    elements.wordsSelect.addEventListener('change', handleWordsChange);
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
});

// ============================================
// FORM HANDLERS
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const structure = elements.structureSelect.value;
    const words = elements.wordsSelect.value;
    
    if (!structure || !words) {
        showError('Please select both structure and word list.');
        return;
    }
    
    await generateCrossword(structure, words);
}

// ============================================
// PREVIEW HANDLERS
// ============================================
async function handleStructureChange() {
    const filename = elements.structureSelect.value;
    if (!filename) {
        elements.structurePreview.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch('/get-file-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'structure',
                filename: filename
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayStructurePreview(data.preview);
        }
    } catch (error) {
        console.error('Error loading structure preview:', error);
    }
}

async function handleWordsChange() {
    const filename = elements.wordsSelect.value;
    if (!filename) {
        elements.wordsPreview.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch('/get-file-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'words',
                filename: filename
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayWordsPreview(data.words);
        }
    } catch (error) {
        console.error('Error loading words preview:', error);
    }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================
function displayStructurePreview(preview) {
    const container = document.createElement('div');
    container.className = 'structure-preview';
    
    preview.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'structure-row';
        
        row.forEach(cellType => {
            const cell = document.createElement('div');
            cell.className = `structure-cell ${cellType}`;
            rowDiv.appendChild(cell);
        });
        
        container.appendChild(rowDiv);
    });
    
    elements.structurePreview.innerHTML = '';
    elements.structurePreview.appendChild(container);
    
    // Animate cells
    animateCells(container.querySelectorAll('.structure-cell'));
}

function displayWordsPreview(words) {
    const container = document.createElement('div');
    container.className = 'words-preview';
    
    words.slice(0, 10).forEach((word, index) => {
        const tag = document.createElement('span');
        tag.className = 'word-tag';
        tag.textContent = word.toUpperCase();
        tag.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(tag);
    });
    
    if (words.length > 10) {
        const moreTag = document.createElement('span');
        moreTag.className = 'word-tag';
        moreTag.textContent = `+${words.length - 10} more`;
        moreTag.style.animationDelay = `${10 * 0.05}s`;
        container.appendChild(moreTag);
    }
    
    elements.wordsPreview.innerHTML = '';
    elements.wordsPreview.appendChild(container);
}

function animateCells(cells) {
    cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.style.animation = 'popIn 0.3s ease';
        }, index * 30);
    });
}

// ============================================
// CROSSWORD GENERATION
// ============================================
async function generateCrossword(structure, words) {
    showLoading(true);
    hideError();
    
    // Reset stats
    solvingStats = {
        attempts: 0,
        backtracks: 0,
        placements: 0
    };
    
    try {
        currentSessionId = Date.now().toString();
        
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                structure: structure,
                words: words,
                session_id: currentSessionId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show solving visualization panel
            showSolvingVisualization();
            
            // Start polling for progress
            startProgressPolling(data.session_id);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

function startProgressPolling(sessionId) {
    let pollCount = 0;
    const maxPolls = 200; // Prevent infinite polling
    
    solvingInterval = setInterval(async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
            clearInterval(solvingInterval);
            hideLoading();
            showError('Solving timed out. Try a different combination.');
            return;
        }
        
        try {
            const response = await fetch(`/solving-progress/${sessionId}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Process steps
            if (data.steps && data.steps.length > 0) {
                for (const step of data.steps) {
                    await processStep(step);
                }
            }
            
            // Check if complete
            if (data.complete) {
                clearInterval(solvingInterval);
                
                if (data.error) {
                    hideLoading();
                    showError(data.error);
                } else if (data.result) {
                    setTimeout(() => {
                        currentImageData = data.result.image;
                        displayFinalCrossword(data.result);
                        hideLoading();
                    }, 500);
                }
            }
        } catch (error) {
            clearInterval(solvingInterval);
            hideLoading();
            showError(error.message);
        }
    }, 100); // Poll every 100ms
}

async function processStep(step) {
    updateSolvingStats(step);
    updateSolvingLog(step);
    
    if (step.data.grid) {
        updateVisualizationGrid(step.data.grid, step.type, step.data);
    }
    
    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 50));
}

function updateSolvingStats(step) {
    switch (step.type) {
        case 'try_word':
            solvingStats.attempts++;
            break;
        case 'place_word':
            solvingStats.placements++;
            break;
        case 'backtrack':
            solvingStats.backtracks++;
            break;
    }
    
    document.getElementById('attemptsCount').textContent = solvingStats.attempts;
    document.getElementById('placementsCount').textContent = solvingStats.placements;
    document.getElementById('backtracksCount').textContent = solvingStats.backtracks;
}

function updateSolvingLog(step) {
    const logContainer = document.getElementById('solvingLog');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${step.type}`;
    
    let icon = '🔍';
    let message = '';
    
    switch (step.type) {
        case 'select_variable':
            icon = '🎯';
            message = `Selecting variable at (${step.data.variable.i}, ${step.data.variable.j}) ${step.data.variable.direction}`;
            break;
        case 'try_word':
            icon = '💭';
            message = `Trying word: <strong>${step.data.word}</strong>`;
            break;
        case 'place_word':
            icon = '✅';
            message = `Placed: <strong>${step.data.word}</strong>`;
            break;
        case 'backtrack':
            icon = '↩️';
            message = `Backtracking from: ${step.data.word}`;
            break;
        case 'reject_word':
            icon = '❌';
            message = `Rejected: ${step.data.word}`;
            break;
    }
    
    logEntry.innerHTML = `<span class="log-icon">${icon}</span><span class="log-message">${message}</span>`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 50 entries
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

function updateVisualizationGrid(grid, stepType, data) {
    const container = document.getElementById('visualizationGrid');
    container.innerHTML = '';
    
    grid.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'vis-grid-row';
        
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = `vis-grid-cell ${cell.type}`;
            cellDiv.textContent = cell.letter;
            
            // Highlight current variable
            if (data.variable) {
                const varData = data.variable;
                if (varData.direction === 'across') {
                    if (rowIndex === varData.i && colIndex >= varData.j && colIndex < varData.j + varData.length) {
                        cellDiv.classList.add('highlight');
                        if (stepType === 'place_word') {
                            cellDiv.classList.add('success');
                        } else if (stepType === 'reject_word') {
                            cellDiv.classList.add('error');
                        } else if (stepType === 'try_word') {
                            cellDiv.classList.add('trying');
                        }
                    }
                } else if (varData.direction === 'down') {
                    if (colIndex === varData.j && rowIndex >= varData.i && rowIndex < varData.i + varData.length) {
                        cellDiv.classList.add('highlight');
                        if (stepType === 'place_word') {
                            cellDiv.classList.add('success');
                        } else if (stepType === 'reject_word') {
                            cellDiv.classList.add('error');
                        } else if (stepType === 'try_word') {
                            cellDiv.classList.add('trying');
                        }
                    }
                }
            }
            
            rowDiv.appendChild(cellDiv);
        });
        
        container.appendChild(rowDiv);
    });
}

function showSolvingVisualization() {
    elements.placeholder.style.display = 'none';
    const vizPanel = document.getElementById('solvingVisualization');
    vizPanel.style.display = 'block';
    
    // Reset visualization
    document.getElementById('visualizationGrid').innerHTML = '<div class="vis-placeholder">Initializing solver...</div>';
    document.getElementById('solvingLog').innerHTML = '';
    document.getElementById('attemptsCount').textContent = '0';
    document.getElementById('placementsCount').textContent = '0';
    document.getElementById('backtracksCount').textContent = '0';
}

function displayFinalCrossword(data) {
    // Hide solving visualization
    document.getElementById('solvingVisualization').style.display = 'none';
    
    // Show result display
    elements.resultDisplay.style.display = 'block';
    
    // Display grid
    displayGrid(data.grid);
    
    // Set image
    elements.crosswordImage.src = `data:image/png;base64,${data.image}`;
    
    // Reset to grid view
    currentView = 'grid';
    updateViewToggle();
    
    // Show completion animation
    showCompletionAnimation();
    
    // Scroll to result
    setTimeout(() => {
        elements.resultDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

function showCompletionAnimation() {
    const cells = document.querySelectorAll('.grid-cell.cell');
    cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.style.animation = 'none';
            setTimeout(() => {
                cell.style.animation = 'celebrate 0.6s ease';
            }, 10);
        }, index * 20);
    });
}

function displayCrossword(data) {
    // This function is now replaced by displayFinalCrossword
    displayFinalCrossword(data);
}

function displayGrid(grid) {
    elements.crosswordGrid.innerHTML = '';
    
    grid.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = `grid-cell ${cell.type}`;
            cellDiv.textContent = cell.letter;
            cellDiv.style.animationDelay = `${(rowIndex * row.length + colIndex) * 0.02}s`;
            rowDiv.appendChild(cellDiv);
        });
        
        elements.crosswordGrid.appendChild(rowDiv);
    });
}

// ============================================
// VIEW TOGGLE
// ============================================
function toggleView() {
    if (currentView === 'grid') {
        currentView = 'image';
        elements.gridView.style.display = 'none';
        elements.imageView.style.display = 'block';
    } else {
        currentView = 'grid';
        elements.gridView.style.display = 'block';
        elements.imageView.style.display = 'none';
    }
    updateViewToggle();
}

function updateViewToggle() {
    if (currentView === 'grid') {
        elements.viewToggleIcon.textContent = '🖼️';
        elements.viewToggleText.textContent = 'Image View';
    } else {
        elements.viewToggleIcon.textContent = '📋';
        elements.viewToggleText.textContent = 'Grid View';
    }
}

// ============================================
// IMAGE DOWNLOAD
// ============================================
function downloadImage() {
    if (!currentImageData) {
        showError('No image available to download');
        return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${currentImageData}`;
    link.download = `crossword_${Date.now()}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success feedback
    showSuccessToast('Crossword downloaded successfully!');
}

// ============================================
// UI FEEDBACK
// ============================================
function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.style.display = 'flex';
        elements.generateBtn.classList.add('loading');
        elements.generateBtn.disabled = true;
    } else {
        elements.loadingOverlay.style.display = 'none';
        elements.generateBtn.classList.remove('loading');
        elements.generateBtn.disabled = false;
    }
}

function hideLoading() {
    showLoading(false);
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.placeholder.style.display = 'none';
    elements.resultDisplay.style.display = 'none';
    
    // Scroll to error
    setTimeout(() => {
        elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <span class="toast-icon">✓</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Add toast styles
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, var(--success-color), #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================
// ANIMATIONS
// ============================================
// Add animation keyframes via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        elements.form.dispatchEvent(new Event('submit'));
    }
    
    // Escape to hide error
    if (e.key === 'Escape') {
        hideError();
    }
});

// ============================================
// CONSOLE MESSAGE
// ============================================
console.log('%c🧩 Crossword Puzzle Generator', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cBuilt with ❤️ using Flask, HTML, CSS & JavaScript', 'font-size: 12px; color: #94a3b8;');
