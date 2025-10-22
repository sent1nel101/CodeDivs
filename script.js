 // emmet trial - will be scoped to HTML editor only
 emmet.require('textarea').setup({
    pretty_break: true, // enable formatted line breaks (when inserting 
                        // between opening and closing tag) 
    use_tab: true       // expand abbreviations by Tab key
});

// Helper function to insert tab character in textareas
function insertTab(textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.slice(0, start) + '\t' + textarea.value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
}

// Helper function to remove indentation (outdent)
function removeTab(textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
        lineStart--;
    }
    
    // Check if line starts with tab or spaces
    if (text[lineStart] === '\t') {
        // Remove one tab
        textarea.value = text.slice(0, lineStart) + text.slice(lineStart + 1);
        textarea.selectionStart = Math.max(lineStart, start - 1);
        textarea.selectionEnd = Math.max(lineStart, end - 1);
    } else if (text.slice(lineStart, lineStart + 4) === '    ') {
        // Remove 4 spaces
        textarea.value = text.slice(0, lineStart) + text.slice(lineStart + 4);
        textarea.selectionStart = Math.max(lineStart, start - 4);
        textarea.selectionEnd = Math.max(lineStart, end - 4);
    } else if (text.slice(lineStart, lineStart + 2) === '  ') {
        // Remove 2 spaces
        textarea.value = text.slice(0, lineStart) + text.slice(lineStart + 2);
        textarea.selectionStart = Math.max(lineStart, start - 2);
        textarea.selectionEnd = Math.max(lineStart, end - 2);
    }
}

// Snippet expansion function
function tryExpandSnippet(textarea) {
    if (!textarea.snippets) return false;
    
    const currentWord = getCurrentWord(textarea);
    if (!currentWord) return false;
    
    const snippet = textarea.snippets[currentWord];
    if (!snippet) return false;
    
    // Found a snippet, expand it
    const pos = textarea.selectionStart;
    const text = textarea.value;
    const before = text.substring(0, pos - currentWord.length);
    const after = text.substring(pos);
    
    // Insert snippet
    textarea.value = before + snippet + after;
    
    // Position cursor intelligently
    // If snippet has () or '', position cursor inside
    let cursorOffset = snippet.length;
    if (snippet.includes('()')) {
        cursorOffset = before.length + snippet.indexOf('()') + 1;
    } else if (snippet.includes("''")) {
        cursorOffset = before.length + snippet.indexOf("''") + 1;
    } else if (snippet.includes('""')) {
        cursorOffset = before.length + snippet.indexOf('""') + 1;
    } else {
        cursorOffset = before.length + snippet.length;
    }
    
    textarea.selectionStart = textarea.selectionEnd = cursorOffset;
    textarea.dispatchEvent(new Event('change'));
    
    // Close autocomplete dropdown after expansion
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    return true;
}

// Undo/Redo functionality
function setupUndoRedo(textarea) {
    const history = {
        stack: [],
        currentIndex: -1,
        maxSize: 100,
        isUndoing: false
    };
    
    // Save initial state
    history.stack.push({
        value: textarea.value,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd
    });
    history.currentIndex = 0;
    
    // Save state on input with debouncing
    let saveTimeout;
    textarea.addEventListener('input', function(e) {
        if (history.isUndoing) return;
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveState();
        }, 300); // Save after 300ms of no typing
    });
    
    // Also save on focus loss
    textarea.addEventListener('blur', function() {
        if (!history.isUndoing) {
            saveState();
        }
    });
    
    function saveState() {
        const currentState = {
            value: textarea.value,
            selectionStart: textarea.selectionStart,
            selectionEnd: textarea.selectionEnd
        };
        
        // Don't save if nothing changed
        if (history.currentIndex >= 0 && 
            history.stack[history.currentIndex].value === currentState.value) {
            return;
        }
        
        // Remove any states after current index (new branch)
        history.stack = history.stack.slice(0, history.currentIndex + 1);
        
        // Add new state
        history.stack.push(currentState);
        history.currentIndex++;
        
        // Limit history size
        if (history.stack.length > history.maxSize) {
            history.stack.shift();
            history.currentIndex--;
        }
    }
    
    function undo() {
        if (history.currentIndex > 0) {
            history.isUndoing = true;
            history.currentIndex--;
            const state = history.stack[history.currentIndex];
            textarea.value = state.value;
            textarea.selectionStart = state.selectionStart;
            textarea.selectionEnd = state.selectionEnd;
            textarea.dispatchEvent(new Event('change'));
            textarea.focus();
            setTimeout(() => { history.isUndoing = false; }, 50);
        }
    }
    
    function redo() {
        if (history.currentIndex < history.stack.length - 1) {
            history.isUndoing = true;
            history.currentIndex++;
            const state = history.stack[history.currentIndex];
            textarea.value = state.value;
            textarea.selectionStart = state.selectionStart;
            textarea.selectionEnd = state.selectionEnd;
            textarea.dispatchEvent(new Event('change'));
            textarea.focus();
            setTimeout(() => { history.isUndoing = false; }, 50);
        }
    }
    
    // Keyboard shortcuts
    textarea.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            redo();
        }
    });
    
    // Store history reference on textarea for external access if needed
    textarea.undoRedoHistory = history;
}

// Enhanced bracket highlighting with matching visualization
function highlightBrackets(textarea) {
    const openBrackets = ['(', '[', '{'];
    const closeBrackets = [')', ']', '}'];
    const bracketPairs = {'(': ')', '[': ']', '{': '}'};
    const reversePairs = {')': '(', ']': '[', '}': '{'};
    
    textarea.addEventListener('keyup', function(e) {
        const pos = this.selectionStart;
        showBracketMatch(this, pos);
    });
    
    textarea.addEventListener('click', function(e) {
        const pos = this.selectionStart;
        showBracketMatch(this, pos);
    });
    
    textarea.addEventListener('selectionchange', function(e) {
        if (document.activeElement === this) {
            showBracketMatch(this, this.selectionStart);
        }
    });
}

function showBracketMatch(textarea, pos) {
    const text = textarea.value;
    const charBefore = text[pos - 1];
    const charAt = text[pos];
    
    const openBrackets = {'(': ')', '[': ']', '{': '}'};
    const closeBrackets = {')': '(', ']': '[', '}': '{'};
    
    let matchPos = -1;
    let searchChar = null;
    let isForward = false;
    
    // Check if cursor is after an opening bracket or before a closing bracket
    if (openBrackets[charBefore]) {
        searchChar = openBrackets[charBefore];
        matchPos = findMatchingBracket(text, pos - 1, searchChar, true);
        flashBracketHighlight(textarea);
    } else if (closeBrackets[charBefore]) {
        searchChar = closeBrackets[charBefore];
        matchPos = findMatchingBracket(text, pos - 1, searchChar, false);
        flashBracketHighlight(textarea);
    } else if (openBrackets[charAt]) {
        searchChar = openBrackets[charAt];
        matchPos = findMatchingBracket(text, pos, searchChar, true);
        flashBracketHighlight(textarea);
    } else if (closeBrackets[charAt]) {
        searchChar = closeBrackets[charAt];
        matchPos = findMatchingBracket(text, pos, searchChar, false);
        flashBracketHighlight(textarea);
    }
}

function findMatchingBracket(text, startPos, matchChar, forward) {
    const openBrackets = {'(': ')', '[': ']', '{': '}'};
    const closeBrackets = {')': '(', ']': '[', '}': '{'};
    
    let currentChar = text[startPos];
    let stack = 1;
    let i = forward ? startPos + 1 : startPos - 1;
    
    while (forward ? i < text.length : i >= 0) {
        const char = text[i];
        
        if (forward) {
            if (openBrackets[currentChar] === char) {
                stack--;
                if (stack === 0) return i;
            } else if (char === currentChar) {
                stack++;
            }
        } else {
            if (closeBrackets[currentChar] === char) {
                stack--;
                if (stack === 0) return i;
            } else if (char === currentChar) {
                stack++;
            }
        }
        
        i = forward ? i + 1 : i - 1;
    }
    
    return -1;
}

function flashBracketHighlight(element) {
    element.style.transition = 'background-color 0.15s';
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'rgba(100, 180, 255, 0.08)';
    setTimeout(() => {
        element.style.backgroundColor = originalBg;
    }, 150);
}

// Snippet definitions
const cssSnippets = {
    // Display & Position
    'df': 'display: flex;',
    'dg': 'display: grid;',
    'db': 'display: block;',
    'dn': 'display: none;',
    'dib': 'display: inline-block;',
    'pa': 'position: absolute;',
    'pr': 'position: relative;',
    'pf': 'position: fixed;',
    'ps': 'position: sticky;',
    
    // Flexbox
    'fdc': 'flex-direction: column;',
    'fdr': 'flex-direction: row;',
    'jcc': 'justify-content: center;',
    'jcsb': 'justify-content: space-between;',
    'jcsa': 'justify-content: space-around;',
    'jcse': 'justify-content: space-evenly;',
    'jcfs': 'justify-content: flex-start;',
    'jcfe': 'justify-content: flex-end;',
    'aic': 'align-items: center;',
    'aifs': 'align-items: flex-start;',
    'aife': 'align-items: flex-end;',
    'fww': 'flex-wrap: wrap;',
    'fwn': 'flex-wrap: nowrap;',
    'fg1': 'flex-grow: 1;',
    'fs0': 'flex-shrink: 0;',
    
    // Grid
    'gtc': 'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));',
    'gtr': 'grid-template-rows: ',
    'gg': 'grid-gap: 1rem;',
    'gac': 'grid-auto-columns: ',
    'gar': 'grid-auto-rows: ',
    
    // Sizing
    'w100': 'width: 100%;',
    'h100': 'height: 100%;',
    'wvw': 'width: 100vw;',
    'hvh': 'height: 100vh;',
    'miw': 'min-width: ',
    'mih': 'min-height: ',
    'maw': 'max-width: ',
    'mah': 'max-height: ',
    
    // Spacing
    'mxa': 'margin: 0 auto;',
    'm0': 'margin: 0;',
    'p0': 'padding: 0;',
    
    // Text
    'tac': 'text-align: center;',
    'tal': 'text-align: left;',
    'tar': 'text-align: right;',
    'taj': 'text-align: justify;',
    'ttu': 'text-transform: uppercase;',
    'ttl': 'text-transform: lowercase;',
    'ttc': 'text-transform: capitalize;',
    'tdn': 'text-decoration: none;',
    'tdu': 'text-decoration: underline;',
    
    // Colors & Background
    'bgc': 'background-color: ',
    'bgi': 'background-image: url("");',
    'bgs': 'background-size: cover;',
    'bgp': 'background-position: center;',
    'bgr': 'background-repeat: no-repeat;',
    
    // Box Model
    'bsbb': 'box-sizing: border-box;',
    'ovh': 'overflow: hidden;',
    'ova': 'overflow: auto;',
    'ovs': 'overflow: scroll;',
    
    // Border & Shadow
    'bdr': 'border-radius: ',
    'bdn': 'border: none;',
    'bs': 'box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);',
    'bsh': 'box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);',
    
    // Transforms & Transitions
    'trs': 'transform: ',
    'trso': 'transform-origin: center;',
    'trf': 'transform: translate(-50%, -50%);',
    'tscale': 'transform: scale(1);',
    'trot': 'transform: rotate(0deg);',
    'trsn': 'transition: all 0.3s ease;',
    
    // Animations
    'anim': 'animation: name 1s ease infinite;',
    
    // Common Patterns
    'cnt': 'display: flex;\njustify-content: center;\nalign-items: center;',
    'abs-center': 'position: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);',
    'truncate': 'white-space: nowrap;\noverflow: hidden;\ntext-overflow: ellipsis;',
    'clearfix': 'content: "";\ndisplay: table;\nclear: both;'
};

const jsSnippets = {
    // Console
    'cl': 'console.log();',
    'ce': 'console.error();',
    'cw': 'console.warn();',
    'ct': 'console.table();',
    'cd': 'console.dir();',
    
    // Functions
    'fun': 'function name() {\n    \n}',
    'af': '() => {}',
    'afn': 'const name = () => {}',
    'iif': '(function() {\n    \n})();',
    'async': 'async function name() {\n    \n}',
    'await': 'await ',
    
    // DOM Selection
    'qs': 'document.querySelector(\'\');',
    'qsa': 'document.querySelectorAll(\'\');',
    'gid': 'document.getElementById(\'\');',
    'gcn': 'document.getElementsByClassName(\'\');',
    'gtn': 'document.getElementsByTagName(\'\');',
    
    // DOM Manipulation
    'cel': 'document.createElement(\'\');',
    'ac': '.appendChild();',
    'rc': '.removeChild();',
    'ctn': '.createTextNode(\'\');',
    
    // Events
    'ael': 'addEventListener(\'click\', () => {\n    \n});',
    'rel': 'removeEventListener(\'click\', );',
    'pdef': 'preventDefault();',
    'sprop': 'stopPropagation();',
    
    // Array Methods
    'fe': 'forEach((item) => {\n    \n});',
    'map': 'map((item) => {\n    \n});',
    'flt': 'filter((item) => {\n    \n});',
    'fnd': 'find((item) => item.);',
    'sme': 'some((item) => item.);',
    'evr': 'every((item) => item.);',
    'red': 'reduce((acc, item) => acc + item, 0);',
    
    // Object Methods
    'keys': 'Object.keys();',
    'vals': 'Object.values();',
    'ents': 'Object.entries();',
    'assign': 'Object.assign({}, );',
    'freeze': 'Object.freeze();',
    
    // Destructuring
    'dob': 'const { } = ;',
    'dar': 'const [ ] = ;',
    
    // Promises & Async
    'prom': 'new Promise((resolve, reject) => {\n    \n});',
    'then': '.then((result) => {\n    \n});',
    'catch': '.catch((error) => {\n    \n});',
    'finally': '.finally(() => {\n    \n});',
    'tcf': '.then((result) => {\n    \n}).catch((error) => {\n    \n}).finally(() => {\n    \n});',
    
    // Timers
    'sto': 'setTimeout(() => {\n    \n}, 1000);',
    'sti': 'setInterval(() => {\n    \n}, 1000);',
    'cto': 'clearTimeout();',
    'cti': 'clearInterval();',
    
    // Conditionals & Loops
    'if': 'if () {\n    \n}',
    'ife': 'if () {\n    \n} else {\n    \n}',
    'ter': ' ? : ;',
    'sw': 'switch () {\n    case :\n        break;\n    default:\n        break;\n}',
    'for': 'for (let i = 0; i < ; i++) {\n    \n}',
    'forin': 'for (const key in object) {\n    \n}',
    'forof': 'for (const item of array) {\n    \n}',
    'wh': 'while () {\n    \n}',
    
    // Try/Catch
    'try': 'try {\n    \n} catch (error) {\n    \n}',
    'tryf': 'try {\n    \n} catch (error) {\n    \n} finally {\n    \n}',
    
    // Class
    'cls': 'class Name {\n    constructor() {\n        \n    }\n}',
    'met': 'methodName() {\n    \n}',
    
    // Import/Export
    'imp': 'import { } from \'\';',
    'impd': 'import name from \'\';',
    'exp': 'export { };',
    'expd': 'export default ',
    
    // Fetch API
    'fetch': 'fetch(\'\')\n    .then(response => response.json())\n    .then(data => console.log(data))\n    .catch(error => console.error(error));',
    'fetchasync': 'async function fetchData() {\n    try {\n        const response = await fetch(\'\');\n        const data = await response.json();\n        console.log(data);\n    } catch (error) {\n        console.error(error);\n    }\n}',
    
    // LocalStorage
    'lsset': 'localStorage.setItem(\'\', );',
    'lsget': 'localStorage.getItem(\'\');',
    'lsrem': 'localStorage.removeItem(\'\');',
    'lsclr': 'localStorage.clear();',
    
    // JSON
    'jpars': 'JSON.parse();',
    'jstr': 'JSON.stringify();'
};

const htmlSnippets = {
    // Document Structure
    'html5': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>',
    'doc': '<!DOCTYPE html>',
    
    // Head Elements
    'meta': '<meta name="" content="">',
    'metavp': '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    'metautf': '<meta charset="UTF-8">',
    'link': '<link rel="stylesheet" href="">',
    'script': '<script src=""></script>',
    'scripti': '<script>\n    \n</script>',
    'style': '<style>\n    \n</style>',
    
    // Semantic Elements
    'header': '<header>\n    \n</header>',
    'nav': '<nav>\n    \n</nav>',
    'main': '<main>\n    \n</main>',
    'section': '<section>\n    \n</section>',
    'article': '<article>\n    \n</article>',
    'aside': '<aside>\n    \n</aside>',
    'footer': '<footer>\n    \n</footer>',
    
    // Forms
    'form': '<form action="" method="post">\n    \n</form>',
    'input': '<input type="text" name="" id="">',
    'inputemail': '<input type="email" name="email" id="email" required>',
    'inputpass': '<input type="password" name="password" id="password" required>',
    'inputcheck': '<input type="checkbox" name="" id="">',
    'inputradio': '<input type="radio" name="" id="" value="">',
    'textarea': '<textarea name="" id="" rows="4" cols="50"></textarea>',
    'select': '<select name="" id="">\n    <option value=""></option>\n</select>',
    'label': '<label for=""></label>',
    'btn': '<button type="button"></button>',
    'btnsubmit': '<button type="submit">Submit</button>',
    
    // Lists
    'ul': '<ul>\n    <li></li>\n</ul>',
    'ol': '<ol>\n    <li></li>\n</ol>',
    'li': '<li></li>',
    
    // Media
    'img': '<img src="" alt="">',
    'imgresp': '<img src="" alt="" loading="lazy">',
    'picture': '<picture>\n    <source srcset="" media="(min-width: )">\n    <img src="" alt="">\n</picture>',
    'video': '<video controls>\n    <source src="" type="video/mp4">\n</video>',
    'audio': '<audio controls>\n    <source src="" type="audio/mp3">\n</audio>',
    'iframe': '<iframe src="" frameborder="0"></iframe>',
    
    // Links
    'a': '<a href=""></a>',
    'aext': '<a href="" target="_blank" rel="noopener noreferrer"></a>',
    'amail': '<a href="mailto:"></a>',
    'atel': '<a href="tel:"></a>',
    
    // Tables
    'table': '<table>\n    <thead>\n        <tr>\n            <th></th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr>\n            <td></td>\n        </tr>\n    </tbody>\n</table>',
    
    // Common Containers
    'div': '<div class=""></div>',
    'divc': '<div class="">\n    \n</div>',
    'span': '<span></span>',
    'p': '<p></p>',
    
    // Text Formatting
    'strong': '<strong></strong>',
    'em': '<em></em>',
    'code': '<code></code>',
    'pre': '<pre><code>\n    \n</code></pre>'
};

// Autocomplete suggestions
const htmlSuggestions = [
    'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button',
    'header', 'footer', 'nav', 'section', 'article', 'main', 'aside',
    ...Object.keys(htmlSnippets)
];

const cssSuggestions = [
    'color', 'background', 'background-color', 'margin', 'padding', 'border',
    'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom',
    'flex', 'grid', 'font-size', 'font-family', 'text-align', 'opacity',
    'transform', 'transition', 'animation', 'box-shadow', 'border-radius',
    ...Object.keys(cssSnippets)
];

const jsSuggestions = [
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
    'document', 'getElementById', 'querySelector', 'addEventListener',
    'console.log', 'Array', 'Object', 'String', 'Number', 'Boolean',
    'setTimeout', 'setInterval', 'fetch', 'Promise', 'async', 'await',
    ...Object.keys(jsSnippets)
];

function createAutocompleteDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'autocomplete-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        background: #2d2d2d;
        border: 1px solid #555;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(dropdown);
    return dropdown;
}

function showAutocomplete(textarea, suggestions, cursorPos) {
    const dropdown = document.getElementById('autocomplete-dropdown') || createAutocompleteDropdown();
    const rect = textarea.getBoundingClientRect();
    
    // Track which editor owns this dropdown to prevent cross-editor interference
    if (dropdown.dataset.owner && dropdown.dataset.owner !== textarea.id) {
        dropdown.style.display = 'none';
    }
    dropdown.dataset.owner = textarea.id;
    
    const currentWord = getCurrentWord(textarea);
    if (!currentWord || currentWord.length < 2) {
        dropdown.style.display = 'none';
        return;
    }
    
    const filtered = suggestions.filter(s => s.toLowerCase().startsWith(currentWord.toLowerCase()));
    
    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    filtered.slice(0, 8).forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.textContent = suggestion;
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            color: #f0f0f0;
            font-family: monospace;
            font-size: 14px;
        `;
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#4a90d9';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        item.addEventListener('click', () => {
            insertSuggestion(textarea, suggestion, currentWord);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(item);
    });
    
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.top + 30) + 'px';
    dropdown.style.display = 'block';
}

function getCurrentWord(textarea) {
    const pos = textarea.selectionStart;
    const text = textarea.value;
    let start = pos;
    
    while (start > 0 && /[a-zA-Z0-9-_]/.test(text[start - 1])) {
        start--;
    }
    
    return text.substring(start, pos);
}

function insertSuggestion(textarea, suggestion, currentWord) {
    const pos = textarea.selectionStart;
    const text = textarea.value;
    const before = text.substring(0, pos - currentWord.length);
    const after = text.substring(pos);
    
    textarea.value = before + suggestion + after;
    textarea.selectionStart = textarea.selectionEnd = before.length + suggestion.length;
    
    textarea.dispatchEvent(new Event('change'));
    textarea.focus();
}

function setupAutocomplete(textarea, suggestions, isHtmlEditor = false, snippets = {}) {
    // Store snippets on textarea for Tab key access
    textarea.snippets = snippets;
    
    textarea.addEventListener('input', function() {
        // Don't show autocomplete for HTML if it looks like an Emmet abbreviation
        if (isHtmlEditor) {
            const currentWord = getCurrentWord(this);
            if (currentWord && (currentWord.includes('.') || currentWord.includes('#') || currentWord.includes('>'))) {
                // Likely an Emmet abbreviation, don't interfere
                return;
            }
        }
        showAutocomplete(this, suggestions, this.selectionStart);
    });
    
    textarea.addEventListener('blur', function() {
        setTimeout(() => {
            const dropdown = document.getElementById('autocomplete-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        }, 200);
    });
    
    textarea.addEventListener('keydown', function(e) {
        const dropdown = document.getElementById('autocomplete-dropdown');
        if (dropdown && dropdown.style.display !== 'none' && dropdown.dataset.owner === this.id) {
            if (e.key === 'Escape') {
                dropdown.style.display = 'none';
                e.preventDefault();
            } else if (e.key === 'Enter') {
                // Use Enter to accept, leave Tab for Emmet
                const firstItem = dropdown.querySelector('div');
                if (firstItem) {
                    firstItem.click();
                    e.preventDefault();
                }
            }
        }
        
        // Auto-close brackets (except < for HTML to avoid conflict with tags)
        const openBrackets = isHtmlEditor ? {'(': ')', '[': ']', '{': '}'} : {'(': ')', '[': ']', '{': '}', '<': '>'};
        if (openBrackets[e.key]) {
            e.preventDefault();
            const pos = this.selectionStart;
            const text = this.value;
            this.value = text.substring(0, pos) + e.key + openBrackets[e.key] + text.substring(pos);
            this.selectionStart = this.selectionEnd = pos + 1;
        }
    });
}

$(function () {
   
// create toggles to HIDE and SHOW input and output panels   
// set the visual styles on panel buttons to show which panels are active.
    $('.toggleButton').on('click', function(){
        $(this).toggleClass('selected');
    })
    
// toggle the horizontal and vertical view of panels and set visual style of the toggler
$('#toggler').on('click', function(){
    $('.contentWrapper').toggleClass('wrapperToggled')
    $('#toggler').toggleClass('toggled')
})

// toggle display of input and output panels
    $('#htmlBtn').on('click', function(){
        $('.html').toggleClass('hidden')
    })
    $('#cssBtn').on('click', function(){
        $('.css').toggleClass('hidden')
    })
    $('#javascriptBtn').on('click', function(){
        $('.javascript').toggleClass('hidden')
    })
    $('#outputBtn').on('click', function(){
        $('.output').toggleClass('hidden')
    })

// run updateContent() when values in the input areas change
    $("#html-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    $("#css-text-area").on('change keyup paste', function(){
        updateContent()                
    })

    $("#javascript-text-area").on('change keyup paste', function(){
        updateContent()                
    })

//create updateContent() to change the content of the iframe with input values 
    function updateContent(){
    $('iframe').contents().find("html").html('<style type="text/css" >' + $('#css-text-area').val() + '</style>' + $('#html-text-area').val());
    document.getElementById("output-text").contentWindow.eval($("#javascript-text-area").val())
    }

    // create function to update panels on page load
    window.onload = function(){
        updateContent()
    }


    var htmlEditor = document.getElementById("html-text-area");
       
    htmlEditor.addEventListener("keyup", function() {
        localStorage.setItem("HtmlTextEditorData", htmlEditor.value) 
         });
    if (window.localStorage["HtmlTextEditorData"]) {
        htmlEditor.value = localStorage.getItem("HtmlTextEditorData", htmlEditor) ;
    } 

    var cssEditor = document.querySelector("#css-text-area");
    cssEditor.addEventListener("keyup", function() {
        localStorage.setItem("CssTextEditorData", cssEditor.value) 
         });
    if (window.localStorage["CssTextEditorData"]) {
        cssEditor.value = localStorage.getItem("CssTextEditorData", cssEditor) ;
    } 

    var javascriptEditor = document.querySelector("#javascript-text-area");
    javascriptEditor.addEventListener("keyup", function() {
        localStorage.setItem("JavascriptTextEditorData", javascriptEditor.value) 
         });
    if (window.localStorage["JavascriptTextEditorData"]) {
        javascriptEditor.value = localStorage.getItem("JavascriptTextEditorData", javascriptEditor) ;
    }

    // Scope Emmet to HTML only by setting syntax attributes
    htmlEditor.setAttribute('data-syntax', 'html');
    cssEditor.setAttribute('data-syntax', 'css');
    javascriptEditor.setAttribute('data-syntax', 'javascript');
    
    // HTML editor: Check for snippet expansion before Emmet
    htmlEditor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // Handle Shift+Tab for outdenting
            if (e.shiftKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                removeTab(this);
                return;
            }
            
            // Close autocomplete dropdown on Tab
            const dropdown = document.getElementById('autocomplete-dropdown');
            if (dropdown && dropdown.style.display !== 'none' && dropdown.dataset.owner === this.id) {
                dropdown.style.display = 'none';
            }
            
            const currentWord = getCurrentWord(this);
            // Only try snippet expansion for non-Emmet patterns
            if (currentWord && !currentWord.includes('.') && !currentWord.includes('#') && !currentWord.includes('>')) {
                const expanded = tryExpandSnippet(this);
                if (expanded) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                // If not expanded, let Emmet handle it
            }
        }
    });
    
    // Prevent Emmet from interfering in CSS/JS editors - use Tab for snippets or indentation
    cssEditor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // Handle Shift+Tab for outdenting
            if (e.shiftKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                removeTab(this);
                return;
            }
            
            const dropdown = document.getElementById('autocomplete-dropdown');
            
            // If autocomplete dropdown is open, accept suggestion with Tab
            if (dropdown && dropdown.style.display !== 'none' && dropdown.dataset.owner === this.id) {
                const firstItem = dropdown.querySelector('div');
                if (firstItem) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    firstItem.click();
                    return;
                }
            }
            
            // Otherwise, try snippet expansion or indent
            const expanded = tryExpandSnippet(this);
            if (!expanded) {
                e.preventDefault();
                e.stopImmediatePropagation();
                insertTab(this);
            } else {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }
    });
    
    javascriptEditor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // Handle Shift+Tab for outdenting
            if (e.shiftKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                removeTab(this);
                return;
            }
            
            const dropdown = document.getElementById('autocomplete-dropdown');
            
            // If autocomplete dropdown is open, accept suggestion with Tab
            if (dropdown && dropdown.style.display !== 'none' && dropdown.dataset.owner === this.id) {
                const firstItem = dropdown.querySelector('div');
                if (firstItem) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    firstItem.click();
                    return;
                }
            }
            
            // Otherwise, try snippet expansion or indent
            const expanded = tryExpandSnippet(this);
            if (!expanded) {
                e.preventDefault();
                e.stopImmediatePropagation();
                insertTab(this);
            } else {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }
    });

    // Initialize bracket highlighting and autocomplete for all editors
    highlightBrackets(htmlEditor);
    highlightBrackets(cssEditor);
    highlightBrackets(javascriptEditor);
    
    // HTML editor: light autocomplete that doesn't conflict with Emmet
    setupAutocomplete(htmlEditor, htmlSuggestions, true, htmlSnippets);
    setupAutocomplete(cssEditor, cssSuggestions, false, cssSnippets);
    setupAutocomplete(javascriptEditor, jsSuggestions, false, jsSnippets);
    
    // Setup undo/redo functionality for all editors
    setupUndoRedo(htmlEditor);
    setupUndoRedo(cssEditor);
    setupUndoRedo(javascriptEditor); 



    // create a download file of the textareas
   /*   function download(){
        var fullText = [];
        var htmlText = document.getElementById("html-text-area").value;
        var cssText = document.getElementById("css-text-area").value;
        var javascriptText = document.getElementById("javascript-text-area").value;
        fullText = [htmlText, cssText, javascriptText]
        var blob = new Blob([fullText], { type: "text/plain"});
        var anchor = document.createElement("a");
        anchor.download = "code-div.txt";
        anchor.href = window.URL.createObjectURL(blob);
        anchor.target ="_blank";
        anchor.style.display = "none"; // just to be safe!
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }  */


    $(function() {
        $('#saveToFile').click(function(e) {
          var data = document.getElementById('html-text-area').value + document.getElementById('css-text-area').value + document.getElementById('javascript-text-area').value;
          var data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(data);
          var el = e.currentTarget;
          el.href = data;
          el.target = '_blank';
          el.download = 'code-divs.txt';
        });
      });


})