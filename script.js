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



    // ============================================
    // Theme Switcher Functionality
    // ============================================
    function initThemeSwitcher() {
        const themeSelector = document.getElementById('theme-selector');
        const htmlElement = document.documentElement;

        // Get saved theme or default to 'auto'
        const savedTheme = localStorage.getItem('codedivs-theme') || 'auto';
        themeSelector.value = savedTheme;

        // Apply theme on load
        applyTheme(savedTheme);

        // Listen for theme changes
        themeSelector.addEventListener('change', function() {
            const selectedTheme = this.value;
            localStorage.setItem('codedivs-theme', selectedTheme);
            applyTheme(selectedTheme);
        });

        // Listen for system theme changes (for auto mode)
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addListener(function() {
                const currentTheme = localStorage.getItem('codedivs-theme') || 'auto';
                if (currentTheme === 'auto') {
                    applyTheme('auto');
                }
            });
        }

        function applyTheme(theme) {
            if (theme === 'auto') {
                // Check system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    htmlElement.setAttribute('data-theme', 'dark');
                } else {
                    htmlElement.setAttribute('data-theme', 'light');
                }
            } else if (theme === 'light') {
                htmlElement.setAttribute('data-theme', 'light');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
            }
        }
    }

    // Initialize theme switcher
    initThemeSwitcher();

    // ============================================
    // Code Formatting Functionality
    // ============================================

    // HTML Formatter
    function formatHTML(code) {
        let formatted = '';
        let indent = 0;
        const tab = '  '; // 2 spaces

        // Remove extra whitespace
        code = code.trim().replace(/\s+</g, '<').replace(/>\s+/g, '>');

        // Split by tags
        const tags = code.match(/<[^>]+>|[^<]+/g) || [];

        tags.forEach(tag => {
            if (tag.startsWith('</')) {
                // Closing tag - decrease indent before adding
                indent = Math.max(0, indent - 1);
                formatted += tab.repeat(indent) + tag + '\n';
            } else if (tag.startsWith('<') && !tag.endsWith('/>') && !tag.startsWith('<!')) {
                // Opening tag - add then increase indent
                formatted += tab.repeat(indent) + tag + '\n';
                // Don't increase indent for self-closing-style tags
                if (!tag.match(/<(br|hr|img|input|meta|link|area|base|col|command|embed|keygen|param|source|track|wbr)/i)) {
                    indent++;
                }
            } else if (tag.startsWith('<')) {
                // Self-closing or special tags
                formatted += tab.repeat(indent) + tag + '\n';
            } else {
                // Text content
                const trimmed = tag.trim();
                if (trimmed) {
                    formatted += tab.repeat(indent) + trimmed + '\n';
                }
            }
        });

        return formatted.trim();
    }

    // CSS Formatter
    function formatCSS(code) {
        let formatted = '';
        let indent = 0;
        const tab = '  ';

        // Remove extra whitespace
        code = code.replace(/\s+/g, ' ').trim();

        // Add newlines and indentation
        for (let i = 0; i < code.length; i++) {
            const char = code[i];

            if (char === '{') {
                formatted += ' {\n';
                indent++;
            } else if (char === '}') {
                indent = Math.max(0, indent - 1);
                formatted += '\n' + tab.repeat(indent) + '}\n\n';
            } else if (char === ';') {
                formatted += ';\n' + tab.repeat(indent);
            } else {
                if (formatted.endsWith('\n') && char !== ' ') {
                    formatted += tab.repeat(indent);
                }
                formatted += char;
            }
        }

        return formatted.trim().replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    // JavaScript Formatter
    function formatJS(code) {
        let formatted = '';
        let indent = 0;
        const tab = '  ';
        let inString = false;
        let stringChar = '';
        let inComment = false;
        let inMultiLineComment = false;

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const next = code[i + 1];
            const prev = code[i - 1];

            // Handle strings
            if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = '';
                }
                formatted += char;
                continue;
            }

            // Handle comments
            if (!inString) {
                if (char === '/' && next === '/' && !inMultiLineComment) {
                    inComment = true;
                    formatted += char;
                    continue;
                }
                if (char === '/' && next === '*') {
                    inMultiLineComment = true;
                    formatted += char;
                    continue;
                }
                if (char === '*' && next === '/' && inMultiLineComment) {
                    formatted += char + next;
                    i++;
                    inMultiLineComment = false;
                    continue;
                }
                if (char === '\n' && inComment) {
                    inComment = false;
                    formatted += '\n' + tab.repeat(indent);
                    continue;
                }
            }

            if (inString || inComment || inMultiLineComment) {
                formatted += char;
                continue;
            }

            // Format code structure
            if (char === '{') {
                formatted += ' {\n';
                indent++;
                if (next && next !== '\n' && next !== ' ') {
                    formatted += tab.repeat(indent);
                }
            } else if (char === '}') {
                indent = Math.max(0, indent - 1);
                if (!formatted.endsWith('\n')) {
                    formatted += '\n';
                }
                formatted += tab.repeat(indent) + '}';
                if (next && next !== ';' && next !== '\n' && next !== ',') {
                    formatted += '\n' + tab.repeat(indent);
                }
            } else if (char === ';') {
                formatted += ';\n' + tab.repeat(indent);
            } else if (char === '\n') {
                if (!formatted.endsWith('\n')) {
                    formatted += '\n' + tab.repeat(indent);
                }
            } else if (char === ' ' && (next === ' ' || prev === '\n')) {
                // Skip extra spaces
                continue;
            } else {
                if (formatted.endsWith('\n') && char !== ' ') {
                    formatted += tab.repeat(indent);
                }
                formatted += char;
            }
        }

        return formatted.trim().replace(/\n\s*\n\s*\n/g, '\n\n');
    }


    // ============================================
    // Library Import Functionality
    // ============================================
    const libraries = [
        {
            name: 'Bootstrap 5',
            desc: 'Popular CSS framework',
            version: '5.3.0',
            css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
        },
        {
            name: 'Tailwind CSS',
            desc: 'Utility-first CSS framework',
            version: '3.3.0',
            css: 'https://cdn.tailwindcss.com'
        },
        {
            name: 'React',
            desc: 'JavaScript library for UI',
            version: '18.2.0',
            js: 'https://unpkg.com/react@18/umd/react.production.min.js',
            jsExtra: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
        },
        {
            name: 'Vue.js',
            desc: 'Progressive JavaScript framework',
            version: '3.3.4',
            js: 'https://unpkg.com/vue@3.3.4/dist/vue.global.js'
        },
        {
            name: 'Alpine.js',
            desc: 'Lightweight JavaScript framework',
            version: '3.13.0',
            js: 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js'
        },
        {
            name: 'Animate.css',
            desc: 'CSS animations library',
            version: '4.1.1',
            css: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
        },
        {
            name: 'Font Awesome',
            desc: 'Icon library',
            version: '6.4.0',
            css: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        },
        {
            name: 'Chart.js',
            desc: 'Simple yet flexible charts',
            version: '4.3.0',
            js: 'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js'
        },
        {
            name: 'Axios',
            desc: 'Promise-based HTTP client',
            version: '1.4.0',
            js: 'https://cdn.jsdelivr.net/npm/axios@1.4.0/dist/axios.min.js'
        },
        {
            name: 'Lodash',
            desc: 'JavaScript utility library',
            version: '4.17.21',
            js: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
        },
        {
            name: 'Three.js',
            desc: '3D graphics library',
            version: 'r154',
            js: 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.min.js'
        },
        {
            name: 'GSAP',
            desc: 'Animation platform',
            version: '3.12.0',
            js: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/gsap.min.js'
        }
    ];

    const modal = document.getElementById('library-modal');
    const importBtn = document.getElementById('importLibrary');
    const closeBtn = document.querySelector('.close');
    const libraryList = document.getElementById('library-list');
    const searchInput = document.getElementById('library-search');

    // Populate library list
    const populateLibraries = (filterText = '') => {
        libraryList.innerHTML = '';
        const filtered = libraries.filter(lib =>
            lib.name.toLowerCase().includes(filterText.toLowerCase()) ||
            lib.desc.toLowerCase().includes(filterText.toLowerCase())
        );

        filtered.forEach(lib => {
            const item = document.createElement('div');
            item.className = 'library-item';
            item.innerHTML = `
                <div class="library-name">${lib.name}</div>
                <div class="library-desc">${lib.desc}</div>
                <div class="library-version">v${lib.version}</div>
            `;

            item.addEventListener('click', function() {
                // Get active tab from VFS (if available)
                if (window.VFS && window.VFS.activeTab) {
                    const activeFile = window.VFS.files[window.VFS.activeTab];
                    if (activeFile && activeFile.type === 'html') {
                        let htmlContent = activeFile.content;
                        let insertPosition = htmlContent.indexOf('</head>');

                        if (insertPosition === -1) {
                            insertPosition = htmlContent.indexOf('<body>');
                            if (insertPosition === -1) {
                                insertPosition = 0;
                            }
                        }

                        let linksToAdd = '';

                        if (lib.css) {
                            linksToAdd += `  <link rel="stylesheet" href="${lib.css}">\n`;
                        }
                        if (lib.js) {
                            linksToAdd += `  <script src="${lib.js}"></script>\n`;
                        }
                        if (lib.jsExtra) {
                            linksToAdd += `  <script src="${lib.jsExtra}"></script>\n`;
                        }

                        if (insertPosition === 0) {
                            htmlContent = linksToAdd + htmlContent;
                        } else {
                            htmlContent = htmlContent.slice(0, insertPosition) + linksToAdd + htmlContent.slice(insertPosition);
                        }

                        // Update VFS and editor
                        activeFile.content = htmlContent;
                        document.getElementById('unified-editor').value = htmlContent;
                        window.VFS.saveCurrentContent();
                        window.VFS.updateOutput();
                    } else {
                        alert('Please open an HTML file first to add this library.');
                    }
                } else {
                    alert('VFS system not loaded. Please refresh the page.');
                }

                this.classList.add('selected');
                setTimeout(() => {
                    this.classList.remove('selected');
                    modal.style.display = 'none';
                }, 300);
            });

            libraryList.appendChild(item);
        });

        if (filtered.length === 0) {
            libraryList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No libraries found</p>';
        }
    };

    // Open modal
    importBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.style.display = 'block';
        populateLibraries();
        searchInput.value = '';
        searchInput.focus();
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        populateLibraries(this.value);
    });

    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    // ============================================
    // Export to Platforms Functionality
    // ============================================
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.querySelector('.export-dropdown');
    const exportMenu = document.getElementById('exportMenu');

    // Toggle dropdown
    exportBtn.addEventListener('click', function(e) {
        e.preventDefault();
        exportDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!exportDropdown.contains(e.target)) {
            exportDropdown.classList.remove('active');
        }
    });

    // Get current code from VFS
    const getCode = () => {
        if (window.VFS && window.VFS.files) {
            let html = '', css = '', js = '';

            Object.values(window.VFS.files).forEach(file => {
                if (file.type === 'html') html += file.content + '\n';
                else if (file.type === 'css') css += file.content + '\n';
                else if (file.type === 'javascript') js += file.content + '\n';
            });

            return { html: html.trim(), css: css.trim(), js: js.trim() };
        }

        // Fallback to empty
        return { html: '', css: '', js: '' };
    };

    // Export to CodePen
    document.getElementById('export-codepen').addEventListener('click', function(e) {
        e.preventDefault();
        const code = getCode();

        const data = {
            title: 'CodeDivs Export',
            description: 'Created with CodeDivs',
            html: code.html,
            css: code.css,
            js: code.js
        };

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://codepen.io/pen/define';
        form.target = '_blank';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(data);

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        exportDropdown.classList.remove('active');
    });

    // Export to JSFiddle
    document.getElementById('export-jsfiddle').addEventListener('click', function(e) {
        e.preventDefault();
        const code = getCode();

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://jsfiddle.net/api/post/library/pure/';
        form.target = '_blank';

        const fields = {
            html: code.html,
            css: code.css,
            js: code.js,
            title: 'CodeDivs Export'
        };

        Object.keys(fields).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        exportDropdown.classList.remove('active');
    });

    // Export to JSBin
    document.getElementById('export-jsbin').addEventListener('click', function(e) {
        e.preventDefault();
        const code = getCode();

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://jsbin.com/?html,css,js,output';
        form.target = '_blank';

        const fields = {
            html: code.html,
            css: code.css,
            javascript: code.js
        };

        Object.keys(fields).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        exportDropdown.classList.remove('active');
    });

    // ============================================
    // URL-Based Code Sharing Functionality
    // ============================================
    const shareModal = document.getElementById('share-modal');
    const shareBtn = document.getElementById('shareBtn');
    const closeShareBtn = document.querySelector('.close-share');
    const shareUrlInput = document.getElementById('share-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const copySuccess = document.getElementById('copy-success');

    // Compress and encode code to URL hash
    const compressToURL = (code) => {
        const json = JSON.stringify(code);
        // Use base64 encoding with URL-safe characters
        const encoded = btoa(unescape(encodeURIComponent(json)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        return encoded;
    };

    // Decompress from URL hash
    const decompressFromURL = (encoded) => {
        try {
            // Restore base64 padding and characters
            const base64 = encoded
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const padding = base64.length % 4;
            const padded = padding ? base64 + '='.repeat(4 - padding) : base64;

            const json = decodeURIComponent(escape(atob(padded)));
            return JSON.parse(json);
        } catch (e) {
            console.error('Failed to decompress code:', e);
            return null;
        }
    };

    // Load code from URL hash on page load
    const loadFromURL = () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const code = decompressFromURL(hash);
            if (code && window.VFS) {
                // Clear existing files and create new ones from shared code
                window.VFS.files = {};

                if (code.html) {
                    const htmlId = window.VFS.createFile('shared.html', 'html', code.html);
                    window.VFS.openTab(htmlId);
                }
                if (code.css) {
                    window.VFS.createFile('shared.css', 'css', code.css);
                }
                if (code.js) {
                    window.VFS.createFile('shared.js', 'javascript', code.js);
                }

                window.VFS.updateOutput();
            }
        }
    };

    // Generate shareable URL
    const generateShareURL = () => {
        const code = getCode();
        const compressed = compressToURL(code);
        const url = window.location.origin + window.location.pathname + '#' + compressed;
        return url;
    };

    // Open share modal
    shareBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const shareUrl = generateShareURL();
        shareUrlInput.value = shareUrl;
        shareModal.style.display = 'block';
        copySuccess.classList.remove('show');

        // Update social share links
        const twitterUrl = `https://twitter.com/intent/tweet?text=Check out my code on CodeDivs!&url=${encodeURIComponent(shareUrl)}`;
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

        document.getElementById('share-twitter').href = twitterUrl;
        document.getElementById('share-linkedin').href = linkedinUrl;
    });

    // Close share modal
    closeShareBtn.addEventListener('click', function() {
        shareModal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });

    // Copy URL to clipboard
    copyUrlBtn.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(shareUrlInput.value);
            copySuccess.classList.add('show');
            setTimeout(() => {
                copySuccess.classList.remove('show');
            }, 3000);
        } catch (err) {
            // Fallback for older browsers
            shareUrlInput.select();
            document.execCommand('copy');
            copySuccess.classList.add('show');
            setTimeout(() => {
                copySuccess.classList.remove('show');
            }, 3000);
        }
    });

    // Load shared code on page load
    loadFromURL();

    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', loadFromURL);

    // ============================================
    // Virtual File System with Tabs
    // ============================================
    const VFS = {
        files: {},
        folders: {},
        collapsedFolders: {},
        openTabs: [],
        activeTab: null,
        popoutWindow: null,
        
        // Split-view properties
        splitMode: false,
        splitOrientation: 'horizontal', // 'horizontal' or 'vertical'
        activeTab1: null,
        activeTab2: null,
        panelWidths: { panel1: 50, panel2: 50 }, // percentages for horizontal
        panelHeights: { panel1: 50, panel2: 50 }, // percentages for vertical

        init() {
            // Start with editor disabled
            this.disableEditor();

            this.loadFromStorage();
            this.loadTabsFromStorage();
            this.loadSplitViewState();
            this.setupEventListeners();
            this.renderFileTree();

            // Create default files if none exist
            if (Object.keys(this.files).length === 0) {
                this.createFile('index.html', 'html', '<p>Hello World!</p>');
                this.createFile('style.css', 'css', 'html{padding: 1rem}');
                this.createFile('script.js', 'javascript', '// enter your JS code here =)');
            }

            // Open tabs or first file
            if (this.openTabs.length > 0) {
                this.renderTabs();
                if (this.activeTab) {
                    this.switchToTab(this.activeTab);
                }
            } else if (Object.keys(this.files).length > 0) {
                const firstFileId = Object.keys(this.files)[0];
                this.openTab(firstFileId);
            }
        },

        createFile(name, type, content = '', folderId = null) {
            const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.files[id] = {
                id,
                name,
                type,
                content,
                folderId,
                created: new Date().toISOString()
            };
            this.saveToStorage();
            this.renderFileTree();
            return id;
        },

        createFolder(name, parentId = null) {
            const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.folders[id] = {
                id,
                name,
                parentId,
                created: new Date().toISOString()
            };
            this.saveToStorage();
            this.renderFileTree();
            return id;
        },

        deleteFile(id) {
            if (!this.files[id]) return;

            if (confirm(`Delete ${this.files[id].name}?`)) {
                // Close tab if open
                this.closeTab(id);

                // Delete file
                delete this.files[id];

                this.saveToStorage();
                this.renderFileTree();
                this.updateOutput();
            }
        },

        deleteFolder(id) {
            if (!this.folders[id]) return;

            // Check if folder has files or subfolders
            const hasFiles = Object.values(this.files).some(file => file.folderId === id);
            const hasSubfolders = Object.values(this.folders).some(folder => folder.parentId === id);

            if (hasFiles || hasSubfolders) {
                if (!confirm(`Folder "${this.folders[id].name}" is not empty. Delete it and all its contents?`)) {
                    return;
                }

                // Delete all files in folder
                Object.keys(this.files).forEach(fileId => {
                    if (this.files[fileId].folderId === id) {
                        this.closeTab(fileId);
                        delete this.files[fileId];
                    }
                });

                // Delete all subfolders recursively
                Object.keys(this.folders).forEach(folderId => {
                    if (this.folders[folderId].parentId === id) {
                        this.deleteFolder(folderId);
                    }
                });
            } else {
                if (!confirm(`Delete folder "${this.folders[id].name}"?`)) {
                    return;
                }
            }

            delete this.folders[id];
            delete this.collapsedFolders[id];
            this.saveToStorage();
            this.renderFileTree();
            this.updateOutput();
        },

        openTab(fileId) {
            if (!this.files[fileId]) return;

            // Check if already open
            if (this.openTabs.includes(fileId)) {
                this.switchToTab(fileId);
                return;
            }

            // Add to open tabs
            this.openTabs.push(fileId);
            this.activeTab = fileId;

            this.renderTabs();
            this.loadFileContent(fileId);
            this.saveTabsToStorage();
        },

        closeTab(fileId) {
            const index = this.openTabs.indexOf(fileId);
            if (index === -1) return;

            // Save current content before closing
            if (this.activeTab === fileId) {
                this.saveCurrentContent();
            }

            // Remove from open tabs
            this.openTabs.splice(index, 1);

            // Switch to another tab or disable editor
            if (this.activeTab === fileId) {
                if (this.openTabs.length > 0) {
                    const newActiveIndex = Math.max(0, index - 1);
                    this.switchToTab(this.openTabs[newActiveIndex]);
                } else {
                    this.activeTab = null;
                    this.disableEditor();
                }
            }

            this.renderTabs();
            this.saveTabsToStorage();
        },

        switchToTab(fileId, targetPanel = 1) {
            if (!this.files[fileId]) return;

            if (this.splitMode) {
                // In split mode, switch specific panel
                this.switchToTabInPanel(fileId, targetPanel);
            } else {
                // Normal single-panel mode
                // Save current tab content
                if (this.activeTab && this.activeTab !== fileId) {
                    this.saveCurrentContent();
                }

                this.activeTab = fileId;
                this.loadFileContent(fileId);
                this.renderTabs();
                this.renderFileTree();
                this.saveTabsToStorage();
            }
        },

        switchToTabInPanel(fileId, panelNumber = 1) {
            if (!this.files[fileId]) return;

            if (panelNumber === 2) {
                if (this.activeTab2 && this.activeTab2 !== fileId) {
                    this.saveCurrentContent2();
                }
                this.activeTab2 = fileId;
                this.loadFileContentInPanel(fileId, 2);
            } else {
                if (this.activeTab1 && this.activeTab1 !== fileId) {
                    this.saveCurrentContent();
                }
                this.activeTab1 = fileId;
                this.loadFileContentInPanel(fileId, 1);
            }

            this.renderTabs();
            this.renderFileTree();
            this.saveTabsToStorage();
        },

        toggleSplitView() {
            this.splitMode = !this.splitMode;

            if (this.splitMode) {
                // Enable split view
                const panel2 = document.getElementById('editor-panel-2');
                const wrapper = document.getElementById('editor-panels-wrapper');
                const divider = document.getElementById('editor-divider');

                panel2.style.display = 'flex';
                wrapper.classList.add('split-' + this.splitOrientation);
                divider.style.display = 'block';

                // Set up second panel with a different tab if available
                if (this.openTabs.length > 1) {
                    this.activeTab2 = this.openTabs[1];
                    this.loadFileContentInPanel(this.openTabs[1], 2);
                } else if (this.openTabs.length === 1) {
                    this.activeTab2 = this.openTabs[0];
                    this.loadFileContentInPanel(this.openTabs[0], 2);
                }

                // Store active tabs from single mode
                this.activeTab1 = this.activeTab;

                // Update button state
                const toggleBtn = document.getElementById('split-toggle-btn');
                if (toggleBtn) {
                    toggleBtn.classList.add('active');
                }

                // Apply saved panel sizes
                this.applyPanelSizes();
            } else {
                // Disable split view
                const panel2 = document.getElementById('editor-panel-2');
                const wrapper = document.getElementById('editor-panels-wrapper');
                const divider = document.getElementById('editor-divider');

                panel2.style.display = 'none';
                wrapper.classList.remove('split-horizontal', 'split-vertical');
                divider.style.display = 'none';

                // Return to single-panel mode with first tab
                this.activeTab = this.activeTab1 || this.openTabs[0];
                if (this.activeTab) {
                    this.loadFileContent(this.activeTab);
                }

                // Update button state
                const toggleBtn = document.getElementById('split-toggle-btn');
                if (toggleBtn) {
                    toggleBtn.classList.remove('active');
                }
            }

            this.renderTabs();
            this.renderFileTree();
            this.saveSplitViewState();
        },

        setupResizableDivider() {
            const divider = document.getElementById('editor-divider');
            const wrapper = document.getElementById('editor-panels-wrapper');
            const panel1 = document.getElementById('editor-panel-1');
            const panel2 = document.getElementById('editor-panel-2');

            if (!divider || !panel1 || !panel2) return;

            let isResizing = false;
            let startX = 0;
            let startY = 0;
            let startWidth1 = 0;
            let startHeight1 = 0;

            divider.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;

                // Get initial sizes
                startWidth1 = panel1.offsetWidth;
                startHeight1 = panel1.offsetHeight;

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                e.preventDefault();
            });

            const handleMouseMove = (e) => {
                if (!isResizing) return;

                if (this.splitOrientation === 'horizontal') {
                    // Horizontal split (side-by-side)
                    const deltaX = e.clientX - startX;
                    const totalWidth = wrapper.offsetWidth;
                    const newWidth1 = startWidth1 + deltaX;
                    const percentage1 = (newWidth1 / totalWidth) * 100;

                    // Clamp between 20% and 80%
                    const clampedPercentage = Math.max(20, Math.min(80, percentage1));

                    panel1.style.width = clampedPercentage + '%';
                    panel2.style.width = (100 - clampedPercentage) + '%';

                    // Update state
                    this.panelWidths = {
                        panel1: clampedPercentage,
                        panel2: 100 - clampedPercentage
                    };
                } else {
                    // Vertical split (stacked)
                    const deltaY = e.clientY - startY;
                    const totalHeight = wrapper.offsetHeight;
                    const newHeight1 = startHeight1 + deltaY;
                    const percentage1 = (newHeight1 / totalHeight) * 100;

                    // Clamp between 20% and 80%
                    const clampedPercentage = Math.max(20, Math.min(80, percentage1));

                    panel1.style.height = clampedPercentage + '%';
                    panel2.style.height = (100 - clampedPercentage) + '%';

                    // Update state
                    this.panelHeights = {
                        panel1: clampedPercentage,
                        panel2: 100 - clampedPercentage
                    };
                }
            };

            const handleMouseUp = () => {
                isResizing = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                this.saveSplitViewState();
            };
        },

        applyPanelSizes() {
            const panel1 = document.getElementById('editor-panel-1');
            const panel2 = document.getElementById('editor-panel-2');

            if (!panel1 || !panel2) return;

            if (this.splitOrientation === 'horizontal') {
                panel1.style.width = this.panelWidths.panel1 + '%';
                panel2.style.width = this.panelWidths.panel2 + '%';
            } else {
                panel1.style.height = this.panelHeights.panel1 + '%';
                panel2.style.height = this.panelHeights.panel2 + '%';
            }
        },

        loadFileContent(fileId) {
            const file = this.files[fileId];
            if (!file) return;

            const editor = document.getElementById('unified-editor');
            editor.value = file.content || '';
            editor.disabled = false;

            this.updateOutput();
        },

        loadFileContentInPanel(fileId, panelNumber = 1) {
            const file = this.files[fileId];
            if (!file) return;

            const editorId = panelNumber === 2 ? 'unified-editor-2' : 'unified-editor';
            const editor = document.getElementById(editorId);
            if (!editor) return;

            editor.value = file.content || '';
            editor.disabled = false;

            this.updateOutput();
        },

        saveCurrentContent() {
            if (!this.activeTab) return;

            const file = this.files[this.activeTab];
            if (!file) return;

            const editor = document.getElementById('unified-editor');
            file.content = editor.value;

            this.saveToStorage();
        },

        saveCurrentContent2() {
            if (!this.activeTab2) return;

            const file = this.files[this.activeTab2];
            if (!file) return;

            const editor = document.getElementById('unified-editor-2');
            if (!editor) return;

            file.content = editor.value;

            this.saveToStorage();
        },

        saveSplitViewState() {
            const splitViewState = {
                splitMode: this.splitMode,
                splitOrientation: this.splitOrientation,
                activeTab1: this.activeTab1,
                activeTab2: this.activeTab2,
                panelWidths: this.panelWidths,
                panelHeights: this.panelHeights
            };
            localStorage.setItem('codedivs_split_view', JSON.stringify(splitViewState));
        },

        loadSplitViewState() {
            const saved = localStorage.getItem('codedivs_split_view');
            if (saved) {
                try {
                    const state = JSON.parse(saved);
                    this.splitMode = state.splitMode || false;
                    this.splitOrientation = state.splitOrientation || 'horizontal';
                    this.activeTab1 = state.activeTab1 || null;
                    this.activeTab2 = state.activeTab2 || null;
                    this.panelWidths = state.panelWidths || { panel1: 50, panel2: 50 };
                    this.panelHeights = state.panelHeights || { panel1: 50, panel2: 50 };
                } catch (e) {
                    console.error('Failed to load split view state:', e);
                }
            }
        },

        disableEditor() {
            const editor = document.getElementById('unified-editor');
            editor.value = '';
            editor.disabled = true;
            editor.placeholder = 'No file open. Create or open a file to start coding.';
        },

        updateOutput() {
            // Combine all HTML files and inject CSS/JS
            let htmlContent = '';
            let cssContent = '';
            let jsContent = '';

            Object.values(this.files).forEach(file => {
                if (file.type === 'html') {
                    htmlContent += file.content + '\n';
                } else if (file.type === 'css') {
                    cssContent += file.content + '\n';
                } else if (file.type === 'javascript') {
                    jsContent += file.content + '\n';
                }
            });

            const output = document.getElementById('output-text');

            // Clear output if no HTML content exists
            if (!htmlContent.trim()) {
                output.srcdoc = '';
                if (this.popoutWindow && !this.popoutWindow.closed) {
                    this.popoutWindow.document.open();
                    this.popoutWindow.document.write('');
                    this.popoutWindow.document.close();
                }
                return;
            }

            const completeHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>${cssContent}</style>
                </head>
                <body>
                    ${htmlContent}
                    <script>${jsContent}</script>
                </body>
                </html>
            `;

            if (this.popoutWindow && !this.popoutWindow.closed) {
                this.popoutWindow.document.open();
                this.popoutWindow.document.write(completeHTML);
                this.popoutWindow.document.close();
            }

            output.srcdoc = completeHTML;
        },

        saveToStorage() {
            const vfsData = {
                files: this.files,
                folders: this.folders,
                collapsedFolders: this.collapsedFolders
            };
            localStorage.setItem('codedivs-vfs', JSON.stringify(vfsData));
        },

        loadFromStorage() {
            const saved = localStorage.getItem('codedivs-vfs');
            if (saved) {
                try {
                    const vfsData = JSON.parse(saved);
                    // Support old format (just files) and new format (files + folders)
                    if (vfsData.files) {
                        this.files = vfsData.files;
                        this.folders = vfsData.folders || {};
                        this.collapsedFolders = vfsData.collapsedFolders || {};
                    } else {
                        // Old format - just files
                        this.files = vfsData;
                        this.folders = {};
                        this.collapsedFolders = {};
                    }
                } catch (e) {
                    console.error('Failed to load VFS:', e);
                    this.files = {};
                    this.folders = {};
                    this.collapsedFolders = {};
                }
            }
        },

        saveTabsToStorage() {
            const tabState = {
                openTabs: this.openTabs,
                activeTab: this.activeTab
            };
            localStorage.setItem('codedivs-tabs', JSON.stringify(tabState));
        },

        loadTabsFromStorage() {
            const saved = localStorage.getItem('codedivs-tabs');
            if (saved) {
                try {
                    const tabState = JSON.parse(saved);
                    this.openTabs = tabState.openTabs || [];
                    this.activeTab = tabState.activeTab || null;
                } catch (e) {
                    console.error('Failed to load tabs:', e);
                }
            }
        },

        renderTabs() {
            const container = document.getElementById('tabs-container');
            container.innerHTML = '';

            this.openTabs.forEach(fileId => {
                const file = this.files[fileId];
                if (!file) return;

                const tab = document.createElement('div');
                let isActive = false;
                let isInPanel2 = false;

                if (this.splitMode) {
                    // In split mode, check which panel this tab is in
                    isActive = this.activeTab1 === fileId || this.activeTab2 === fileId;
                    isInPanel2 = this.activeTab2 === fileId;
                    tab.className = 'tab' + (isActive ? ' active' : '') + (isInPanel2 ? ' panel-2' : ' panel-1');
                    tab.setAttribute('data-panel', isInPanel2 ? '2' : '1');
                } else {
                    // In single mode, regular active state
                    isActive = this.activeTab === fileId;
                    tab.className = 'tab' + (isActive ? ' active' : '');
                }

                const icon = this.getFileIcon(file.type);

                tab.innerHTML = `
                    <div class="tab-icon">${icon}</div>
                    <div class="tab-name">${file.name}</div>
                    <button class="tab-close">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                `;

                tab.addEventListener('click', (e) => {
                    if (!e.target.closest('.tab-close')) {
                        if (this.splitMode) {
                            const targetPanel = tab.getAttribute('data-panel') === '2' ? 2 : 1;
                            this.switchToTabInPanel(fileId, targetPanel);
                        } else {
                            this.switchToTab(fileId);
                        }
                    }
                });

                const closeBtn = tab.querySelector('.tab-close');
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeTab(fileId);
                });

                // Add right-click context menu to switch panel in split mode
                if (this.splitMode) {
                    tab.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        const currentPanel = tab.getAttribute('data-panel');
                        const newPanel = currentPanel === '1' ? 2 : 1;
                        this.switchToTabInPanel(fileId, newPanel);
                    });
                }

                container.appendChild(tab);
            });
        },

        renderFileTree() {
            const tree = document.getElementById('file-tree');
            tree.innerHTML = '';

            // Render folders and files recursively
            const renderItems = (parentId = null, level = 0) => {
                // Render folders first
                Object.values(this.folders)
                    .filter(folder => folder.parentId === parentId)
                    .forEach(folder => {
                        const folderItem = document.createElement('div');
                        folderItem.className = 'folder-item';
                        folderItem.style.paddingLeft = `${level * 16}px`;

                        const isCollapsed = this.collapsedFolders[folder.id];
                        const chevron = isCollapsed ? '▸' : '▾';

                        folderItem.innerHTML = `
                            <span class="folder-toggle">${chevron}</span>
                            <svg class="folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span class="folder-name">${folder.name}</span>
                            <button class="folder-delete" data-id="${folder.id}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        `;

                        // Toggle collapse/expand
                        const toggleBtn = folderItem.querySelector('.folder-toggle');
                        toggleBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleFolder(folder.id);
                        });

                        // Delete folder
                        const deleteBtn = folderItem.querySelector('.folder-delete');
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.deleteFolder(folder.id);
                        });

                        tree.appendChild(folderItem);

                        // Render nested items if folder is expanded
                        if (!isCollapsed) {
                            renderItems(folder.id, level + 1);
                        }
                    });

                // Render files at this level
                Object.values(this.files)
                    .filter(file => file.folderId === parentId)
                    .forEach(file => {
                        const fileItem = document.createElement('div');
                        let fileItemClass = 'file-item';
                        
                        if (this.splitMode) {
                            if (this.activeTab1 === file.id) fileItemClass += ' active-panel-1';
                            if (this.activeTab2 === file.id) fileItemClass += ' active-panel-2';
                            if (this.activeTab1 === file.id || this.activeTab2 === file.id) fileItemClass += ' active';
                        } else {
                            if (this.activeTab === file.id) fileItemClass += ' active';
                        }
                        
                        fileItem.className = fileItemClass;
                        fileItem.style.paddingLeft = `${(level * 16) + 16}px`;

                        const icon = this.getFileIcon(file.type);

                        fileItem.innerHTML = `
                            ${icon}
                            <span class="file-name">${file.name}</span>
                            <button class="file-delete" data-id="${file.id}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        `;

                        fileItem.addEventListener('click', (e) => {
                            if (!e.target.closest('.file-delete')) {
                                this.openTab(file.id);
                            }
                        });

                        const deleteBtn = fileItem.querySelector('.file-delete');
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.deleteFile(file.id);
                        });

                        tree.appendChild(fileItem);
                    });
            };

            // Start rendering from root level (parentId = null)
            renderItems(null, 0);
        },

        toggleFolder(id) {
            if (this.collapsedFolders[id]) {
                delete this.collapsedFolders[id];
            } else {
                this.collapsedFolders[id] = true;
            }
            this.saveToStorage();
            this.renderFileTree();
        },

        getFileIcon(type) {
            const icons = {
                html: '<svg class="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
                css: '<svg class="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
                javascript: '<svg class="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
            };
            return icons[type] || icons.html;
        },

        setupEventListeners() {
            // New file button
            const newFileBtn = document.getElementById('new-file-btn');
            if (newFileBtn) {
                newFileBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const name = prompt('Enter file name (e.g., test.html, styles.css, app.js):');
                    if (name && name.trim()) {
                        let type = 'html';
                        if (name.endsWith('.css')) type = 'css';
                        else if (name.endsWith('.js')) type = 'javascript';

                        let folderId = null;
                        const folders = Object.values(this.folders);
                        if (folders.length > 0) {
                            const folderNames = ['Root (no folder)', ...folders.map(f => f.name)];
                            const choice = prompt(`Choose folder:\n${folderNames.map((n, i) => `${i}: ${n}`).join('\n')}\n\nEnter number (default 0):`);
                            if (choice === null) return; // User cancelled
                            const folderIndex = parseInt(choice) || 0;
                            if (folderIndex > 0 && folderIndex <= folders.length) {
                                folderId = folders[folderIndex - 1].id;
                            }
                        }

                        const id = this.createFile(name.trim(), type, '', folderId);
                        this.openTab(id);
                    }
                };
            }

            // New folder button
            const newFolderBtn = document.getElementById('new-folder-btn');
            if (newFolderBtn) {
                newFolderBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const name = prompt('Enter folder name:');
                    if (name && name.trim()) {
                        this.createFolder(name.trim());
                    }
                };
            }

            // Toggle explorer
            const toggleExplorerBtn = document.getElementById('toggle-explorer');
            if (toggleExplorerBtn) {
                toggleExplorerBtn.addEventListener('click', () => {
                    const explorer = document.getElementById('file-explorer');
                    explorer.classList.toggle('collapsed');
                });
            }

            // File toggle button in tab bar
            const fileToggleBtn = document.getElementById('file-toggle-btn');
            if (fileToggleBtn) {
                fileToggleBtn.addEventListener('click', () => {
                    const explorer = document.getElementById('file-explorer');
                    explorer.classList.toggle('collapsed');
                });
            }

            // Split toggle button
            const splitToggleBtn = document.getElementById('split-toggle-btn');
            if (splitToggleBtn) {
                splitToggleBtn.addEventListener('click', () => {
                    this.toggleSplitView();
                });
            }

            // Resizable divider for split panels
            this.setupResizableDivider();

            // Pop-out output button
            const popoutBtn = document.getElementById('popout-output-btn');
            if (popoutBtn) {
                popoutBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (this.popoutWindow && !this.popoutWindow.closed) {
                        this.popoutWindow.focus();
                        return;
                    }

                    // Open pop-out window
                    this.popoutWindow = window.open('', 'CodeDivs Output', 'width=800,height=600,menubar=no,toolbar=no,location=no');

                    if (this.popoutWindow) {
                        // Hide main output panel
                        document.getElementById('output-container').style.display = 'none';

                        // Update output to populate pop-out
                        this.updateOutput();

                        // Re-show main output when pop-out closes
                        const checkClosed = setInterval(() => {
                            if (this.popoutWindow.closed) {
                                clearInterval(checkClosed);
                                document.getElementById('output-container').style.display = 'flex';
                                this.popoutWindow = null;
                                this.updateOutput();
                            }
                        }, 500);
                    }
                };
            }

            // Toggle output button
            const toggleOutputBtn = document.getElementById('toggle-output-btn');
            if (toggleOutputBtn) {
                toggleOutputBtn.addEventListener('click', () => {
                    const outputContainer = document.getElementById('output-container');
                    if (outputContainer.style.display === 'none') {
                        outputContainer.style.display = 'flex';
                    } else {
                        outputContainer.style.display = 'none';
                    }
                });
            }

            // Close output button
            const closeOutputBtn = document.getElementById('close-output-btn');
            if (closeOutputBtn) {
                closeOutputBtn.addEventListener('click', () => {
                    document.getElementById('output-container').style.display = 'none';
                });
            }

            // Format button
            const formatBtn = document.getElementById('format-current');
            if (formatBtn) {
                formatBtn.addEventListener('click', () => {
                    if (!this.activeTab) return;

                    const file = this.files[this.activeTab];
                    const editor = document.getElementById('unified-editor');
                    const code = editor.value;

                    let formatted;
                    if (file.type === 'html') {
                        formatted = formatHTML(code);
                    } else if (file.type === 'css') {
                        formatted = formatCSS(code);
                    } else if (file.type === 'javascript') {
                        formatted = formatJS(code);
                    } else {
                        return;
                    }

                    editor.value = formatted;
                    this.saveCurrentContent();
                    this.updateOutput();
                });
            }

            // Auto-save on typing in unified editor
            const editor = document.getElementById('unified-editor');
            if (editor) {
                let saveTimeout;
                editor.addEventListener('input', () => {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        this.saveCurrentContent();
                        this.updateOutput();
                    }, 500);
                });
            }
        }
    };

    // Initialize VFS and make it globally accessible
    window.VFS = VFS;
    VFS.init();


    // Update Save to File button to work with VFS
    $(function() {
        $('#saveToFile').click(function(e) {
            if (window.VFS && window.VFS.files) {
                const code = getCode();
                const data = 'HTML:\n' + code.html + '\n\nCSS:\n' + code.css + '\n\nJavaScript:\n' + code.js;
                const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data);
                const el = e.currentTarget;
                el.href = dataUri;
                el.target = '_blank';
                el.download = 'codedivs-export.txt';
            } else {
                alert('VFS system not loaded. Please refresh the page.');
            }
        });
    });

    // Phase 2.3: Mobile Hamburger Menu & File Toggle
    $(function() {
        // Initialize hamburger menu and drawer on mobile
        function initHamburgerMenu() {
            const hamburger = document.querySelector('.hamburger-menu');
            const drawer = document.querySelector('.mobile-drawer');
            
            if (!hamburger || !drawer) return;
            
            // Toggle drawer on hamburger click
            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                hamburger.classList.toggle('active');
                drawer.classList.toggle('show');
            });
            
            // Handle drawer item clicks for theme selection
            const themeOptions = document.querySelectorAll('.drawer-item.theme-option');
            themeOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const theme = option.dataset.theme;
                    const selector = document.getElementById('theme-selector');
                    if (selector) {
                        selector.value = theme;
                        selector.dispatchEvent(new Event('change'));
                    }
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                });
            });
            
            // Handle mobile action button clicks
            const mobileImport = document.getElementById('mobile-import');
            if (mobileImport) {
                mobileImport.addEventListener('click', () => {
                    document.getElementById('importLibrary').click();
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                });
            }
            
            const mobileExport = document.getElementById('mobile-export');
            if (mobileExport) {
                mobileExport.addEventListener('click', () => {
                    document.getElementById('exportBtn').click();
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                });
            }
            
            const mobileShare = document.getElementById('mobile-share');
            if (mobileShare) {
                mobileShare.addEventListener('click', () => {
                    document.getElementById('shareBtn').click();
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                });
            }
            
            const mobileSave = document.getElementById('mobile-save');
            if (mobileSave) {
                mobileSave.addEventListener('click', () => {
                    document.getElementById('saveToFile').click();
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                });
            }
            
            // Mobile file explorer toggle (use same 'collapsed' class as desktop toggle)
            const mobileFileToggle = document.getElementById('mobile-file-toggle');
            const fileExplorer = document.getElementById('file-explorer');
            if (mobileFileToggle && fileExplorer) {
                // Initialize collapsed on mobile (hide by default)
                if (window.innerWidth <= 600) {
                    fileExplorer.classList.add('collapsed');
                }
                
                // Toggle on click
                mobileFileToggle.addEventListener('click', () => {
                    fileExplorer.classList.toggle('collapsed');
                    const isCollapsed = fileExplorer.classList.contains('collapsed');
                    mobileFileToggle.setAttribute('aria-pressed', !isCollapsed ? 'true' : 'false');
                });
            }
            
            // Close drawer when clicking overlay
            drawer.addEventListener('click', (e) => {
                if (e.target === drawer) {
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                }
            });
            
            // Close drawer on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && drawer.classList.contains('show')) {
                    hamburger.classList.remove('active');
                    drawer.classList.remove('show');
                }
            });
        }
        
        initHamburgerMenu();
    });


    })