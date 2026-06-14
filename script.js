const state = {
    current: '0',
    previous: '',
    operation: null,
    resetScreen: false,
    history: JSON.parse(localStorage.getItem('calcHistory') || '[]'),
    historyOpen: false,
};

const els = {
    displayExpression: document.getElementById('displayExpression'),
    displayResult: document.getElementById('displayResult'),
    displayHistory: document.getElementById('displayHistory'),
    themeToggle: document.getElementById('themeToggle'),
    historyPanel: document.getElementById('historyPanel'),
    historyList: document.getElementById('historyList'),
    historyClear: document.getElementById('historyClear'),
    historyToggle: document.getElementById('historyToggle'),
};

function initTheme() {
    const theme = localStorage.getItem('calcTheme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('calcTheme', next);
}

function formatNumber(n) {
    const str = String(n);
    if (str.length > 14) {
        return Number(n).toExponential(6);
    }
    return str;
}

function updateDisplay() {
    els.displayExpression.textContent = state.current || '0';

    if (state.operation && state.previous) {
        const opSymbol = getOpSymbol(state.operation);
        els.displayHistory.textContent = `${formatNumber(state.previous)} ${opSymbol}`;
    } else {
        els.displayHistory.textContent = '';
    }
}

function getOpSymbol(op) {
    const map = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    return map[op] || '';
}

function inputNumber(num) {
    if (state.resetScreen) {
        state.current = '';
        state.resetScreen = false;
    }
    if (state.current === '0' && num !== '.') {
        state.current = '';
    }
    if (num === '.' && state.current.includes('.')) return;
    if (state.current.length >= 14) return;
    state.current += num;
    els.displayResult.textContent = '';
    updateDisplay();
}

function inputOperator(op) {
    if (state.operation && !state.resetScreen) {
        calculate();
    }
    if (state.current === '' || state.current === '-') {
        state.current = '0';
    }
    state.previous = state.current;
    state.operation = op;
    state.resetScreen = true;
    els.displayResult.textContent = '';
    updateDisplay();
}

function calculate() {
    if (!state.operation || !state.previous) return;
    const prev = parseFloat(state.previous);
    const curr = parseFloat(state.current);
    if (isNaN(prev) || isNaN(curr)) return;

    let result;
    let error = false;
    switch (state.operation) {
        case 'add': result = prev + curr; break;
        case 'subtract': result = prev - curr; break;
        case 'multiply': result = prev * curr; break;
        case 'divide':
            if (curr === 0) {
                error = true;
                result = 'Error';
            } else {
                result = prev / curr;
            }
            break;
        default: return;
    }

    if (error) {
        state.current = 'Error';
        els.displayResult.textContent = '';
        updateDisplay();
        state.operation = null;
        state.previous = '';
        state.resetScreen = true;
        return;
    }

    result = parseFloat(result.toFixed(10));
    addHistory(`${formatNumber(prev)} ${getOpSymbol(state.operation)} ${formatNumber(curr)}`, formatNumber(result));
    state.current = formatNumber(result);
    els.displayResult.textContent = `= ${state.current}`;
    state.operation = null;
    state.previous = '';
    state.resetScreen = true;
    updateDisplay();
}

function inputDecimal() {
    if (state.resetScreen) {
        state.current = '0';
        state.resetScreen = false;
    }
    if (state.current.includes('.')) return;
    state.current += '.';
    els.displayResult.textContent = '';
    updateDisplay();
}

function toggleSign() {
    if (state.current === '0' || state.current === 'Error') return;
    state.current = state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current;
    els.displayResult.textContent = '';
    updateDisplay();
}

function percent() {
    const num = parseFloat(state.current);
    if (isNaN(num)) return;
    state.current = formatNumber(num / 100);
    els.displayResult.textContent = '';
    updateDisplay();
}

function clearAll() {
    state.current = '0';
    state.previous = '';
    state.operation = null;
    state.resetScreen = false;
    els.displayResult.textContent = '';
    els.displayHistory.textContent = '';
    updateDisplay();
}

function addHistory(expr, result) {
    state.history.unshift({ expr, result });
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory() {
    els.historyList.innerHTML = '';
    if (state.history.length === 0) {
        els.historyList.innerHTML = '<div class="history-item" style="justify-content:center;opacity:0.5;">No calculations yet</div>';
        return;
    }
    state.history.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<span class="h-expr">${item.expr}</span><span class="h-result">= ${item.result}</span>`;
        els.historyList.appendChild(div);
    });
}

function toggleHistory() {
    state.historyOpen = !state.historyOpen;
    els.historyPanel.classList.toggle('open', state.historyOpen);
}

function clearHistory() {
    state.history = [];
    localStorage.setItem('calcHistory', JSON.stringify(state.history));
    renderHistory();
}

function handleAction(action) {
    if (state.current === 'Error' && action !== 'clear') {
        clearAll();
        return;
    }

    switch (action) {
        case 'clear': clearAll(); break;
        case 'toggle-sign': toggleSign(); break;
        case 'percent': percent(); break;
        case 'divide': inputOperator('divide'); break;
        case 'multiply': inputOperator('multiply'); break;
        case 'subtract': inputOperator('subtract'); break;
        case 'add': inputOperator('add'); break;
        case 'equals': calculate(); break;
        case 'decimal': inputDecimal(); break;
        default:
            if (/^[0-9]$/.test(action)) inputNumber(action);
            break;
    }
}

function handleKeyboard(e) {
    const key = e.key;
    if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleAction(key);
        animateButton(`[data-action="${key}"]`);
        return;
    }
    const map = {
        '.': 'decimal',
        'Enter': 'equals',
        '=': 'equals',
        'Escape': 'clear',
        'c': 'clear',
        'C': 'clear',
        '%': 'percent',
        '/': 'divide',
        '*': 'multiply',
        '-': 'subtract',
        '+': 'add',
    };
    const action = map[key];
    if (action) {
        e.preventDefault();
        handleAction(action);
        animateButton(`[data-action="${action}"]`);
    }
    if (key === 'Backspace') {
        e.preventDefault();
        if (state.resetScreen || state.current === 'Error') {
            clearAll();
        } else {
            state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
            els.displayResult.textContent = '';
            updateDisplay();
        }
        animateButton('.btn.num:last-child');
    }
}

function animateButton(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.classList.remove('btn-press');
        void btn.offsetWidth;
        btn.classList.add('btn-press');
    }
}

els.themeToggle.addEventListener('click', toggleTheme);

document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        if (action) {
            handleAction(action);
            btn.classList.remove('btn-press');
            void btn.offsetWidth;
            btn.classList.add('btn-press');
        }
    });
    btn.addEventListener('touchstart', () => {
        btn.style.transform = 'scale(0.93)';
    });
    btn.addEventListener('touchend', () => {
        btn.style.transform = '';
    });
});

els.historyClear.addEventListener('click', clearHistory);

els.historyToggle.addEventListener('click', () => {
    toggleHistory();
    els.historyToggle.classList.toggle('open', state.historyOpen);
});

document.addEventListener('keydown', handleKeyboard);

initTheme();
renderHistory();
updateDisplay();
