# CodeDivs - Free Browser-Based Code Sandbox

**CodeDivs** is a powerful, free-to-use, browser-based coding sandbox for practicing and prototyping HTML, CSS, and JavaScript in a live environment. No installation required – just open and code!

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Made with](https://img.shields.io/badge/made%20with-JavaScript-yellow)

## 🚀 Features

### Core Functionality
- **Three-Panel Editor**: Separate editors for HTML, CSS, and JavaScript
- **Live Preview**: Real-time output rendering in iframe
- **Persistent Storage**: Your code is automatically saved using localStorage
- **Responsive Layout**: Toggle between horizontal and vertical panel views
- **Panel Visibility Controls**: Show/hide individual editor panels
- **Save to File**: Download your code as a text file

### Enhanced Code Editing
- ✨ **Emmet Abbreviation Support** (HTML only)
- 🎯 **Smart Autocomplete** with language-specific suggestions
- 💡 **210+ Code Snippets** with Tab expansion
- ⏮️ **Undo/Redo** with Ctrl+Z / Ctrl+Y
- 🔍 **Bracket Matching** with visual highlight
- 📝 **Auto-Close Brackets** for `()`, `[]`, `{}`
- 🎨 **Theme Switcher**: Light, Dark, and Auto modes
- ✨ **Code Formatter**: Beautify HTML, CSS, and JS with one click

### New Productivity Features
- 📁 **Virtual File System**: Create, manage, and organize multiple files with a built-in file explorer
- 📦 **Library Import**: Quick-add popular libraries (Bootstrap, React, Vue, etc.)
- 🔗 **Export to Platforms**: One-click export to CodePen, JSFiddle, or JSBin
- 🌐 **URL Sharing**: Share your code via shareable links with social media integration
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile devices

## 🎯 Getting Started

### Quick Start
1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. Start coding immediately!

### Usage
1. **HTML Panel**: Write your HTML structure (Emmet supported)
2. **CSS Panel**: Style your page with CSS
3. **JavaScript Panel**: Add interactivity with JavaScript
4. **Output Panel**: View live results instantly

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + Shift + Z` | Redo (alternative) |
| `Ctrl + Shift + F` | Format code (HTML, CSS, or JS) |
| `Tab` (HTML) | Expand Emmet abbreviation or snippet |
| `Tab` (CSS/JS) | Expand snippet or indent |
| `Shift + Tab` | Outdent (remove indentation) |
| `Enter` | Accept autocomplete suggestion |
| `Esc` | Close autocomplete dropdown or modals |

## 💎 Code Snippets Reference

### CSS Snippets (90+)

#### Display & Position
| Trigger | Expands To |
|---------|------------|
| `df` | `display: flex;` |
| `dg` | `display: grid;` |
| `db` | `display: block;` |
| `dn` | `display: none;` |
| `dib` | `display: inline-block;` |
| `pa` | `position: absolute;` |
| `pr` | `position: relative;` |
| `pf` | `position: fixed;` |
| `ps` | `position: sticky;` |

#### Flexbox
| Trigger | Expands To |
|---------|------------|
| `fdc` | `flex-direction: column;` |
| `fdr` | `flex-direction: row;` |
| `jcc` | `justify-content: center;` |
| `jcsb` | `justify-content: space-between;` |
| `jcsa` | `justify-content: space-around;` |
| `jcse` | `justify-content: space-evenly;` |
| `aic` | `align-items: center;` |
| `aifs` | `align-items: flex-start;` |
| `aife` | `align-items: flex-end;` |
| `fww` | `flex-wrap: wrap;` |
| `fg1` | `flex-grow: 1;` |

#### Grid
| Trigger | Expands To |
|---------|------------|
| `gtc` | `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));` |
| `gtr` | `grid-template-rows: ` |
| `gg` | `grid-gap: 1rem;` |

#### Sizing
| Trigger | Expands To |
|---------|------------|
| `w100` | `width: 100%;` |
| `h100` | `height: 100%;` |
| `wvw` | `width: 100vw;` |
| `hvh` | `height: 100vh;` |

#### Common Patterns
| Trigger | Expands To |
|---------|------------|
| `cnt` | Center content with flexbox |
| `abs-center` | Absolute center positioning |
| `truncate` | Text truncation with ellipsis |

[See full CSS snippet list in source code]

### JavaScript Snippets (70+)

#### Console
| Trigger | Expands To |
|---------|------------|
| `cl` | `console.log();` |
| `ce` | `console.error();` |
| `cw` | `console.warn();` |
| `ct` | `console.table();` |

#### Functions
| Trigger | Expands To |
|---------|------------|
| `fun` | Function declaration |
| `af` | Arrow function |
| `afn` | Named arrow function |
| `async` | Async function |

#### DOM Selection
| Trigger | Expands To |
|---------|------------|
| `qs` | `document.querySelector('');` |
| `qsa` | `document.querySelectorAll('');` |
| `gid` | `document.getElementById('');` |
| `gcn` | `document.getElementsByClassName('');` |

#### Array Methods
| Trigger | Expands To |
|---------|------------|
| `fe` | `.forEach()` template |
| `map` | `.map()` template |
| `flt` | `.filter()` template |
| `fnd` | `.find()` template |
| `red` | `.reduce()` template |

#### Promises & Async
| Trigger | Expands To |
|---------|------------|
| `prom` | `new Promise()` template |
| `then` | `.then()` template |
| `catch` | `.catch()` template |
| `tcf` | Full `.then().catch().finally()` chain |
| `fetch` | Full fetch API call |
| `fetchasync` | Async/await fetch function |

#### Conditionals & Loops
| Trigger | Expands To |
|---------|------------|
| `if` | If statement |
| `ife` | If-else statement |
| `for` | For loop |
| `forin` | For...in loop |
| `forof` | For...of loop |

#### LocalStorage
| Trigger | Expands To |
|---------|------------|
| `lsset` | `localStorage.setItem()` |
| `lsget` | `localStorage.getItem()` |
| `lsrem` | `localStorage.removeItem()` |

[See full JavaScript snippet list in source code]

### HTML Snippets (50+)

#### Document Structure
| Trigger | Expands To |
|---------|------------|
| `html5` | Complete HTML5 boilerplate |
| `doc` | `<!DOCTYPE html>` |

#### Head Elements
| Trigger | Expands To |
|---------|------------|
| `meta` | Meta tag |
| `metavp` | Viewport meta tag |
| `link` | Link stylesheet |
| `script` | External script tag |
| `scripti` | Inline script tag |

#### Semantic Elements
| Trigger | Expands To |
|---------|------------|
| `header` | `<header>` element |
| `nav` | `<nav>` element |
| `main` | `<main>` element |
| `section` | `<section>` element |
| `article` | `<article>` element |
| `footer` | `<footer>` element |

#### Forms
| Trigger | Expands To |
|---------|------------|
| `form` | Form element |
| `input` | Text input |
| `inputemail` | Email input |
| `inputpass` | Password input |
| `textarea` | Textarea element |
| `select` | Select dropdown |
| `btn` | Button element |

#### Media
| Trigger | Expands To |
|---------|------------|
| `img` | Image tag |
| `imgresp` | Responsive image with lazy loading |
| `video` | Video element |
| `audio` | Audio element |

#### Links
| Trigger | Expands To |
|---------|------------|
| `a` | Anchor tag |
| `aext` | External link (opens in new tab) |
| `amail` | Email link |
| `atel` | Phone link |

[See full HTML snippet list in source code]

## 🛠️ Technology Stack

- **jQuery 3.6.0** - DOM manipulation and event handling
- **jQuery UI 1.13.0** - UI interactions
- **Emmet.js** - HTML abbreviation expansion
- **Vanilla JavaScript** - Core functionality
- **LocalStorage API** - Data persistence
- **CSS3** - Styling and responsive design

## 🎨 Features in Detail

### Emmet Support
Type HTML abbreviations and press Tab to expand:
```
div.container>ul>li*3
```
Expands to:
```html
<div class="container">
    <ul>
        <li></li>
        <li></li>
        <li></li>
    </ul>
</div>
```

### Smart Autocomplete
- Shows language-specific suggestions as you type
- Includes both built-in keywords and snippet triggers
- Press Enter to accept, Esc to dismiss
- Non-intrusive dropdown positioning

### Undo/Redo System
- Saves up to 100 states per editor
- Debounced saving (300ms after typing stops)
- Restores cursor position
- Independent history for each editor

### Auto-Close Brackets
- Automatically adds closing bracket when opening bracket is typed
- Works for `()`, `[]`, `{}` in all editors
- Cursor positioned between brackets for immediate editing

### Theme Switcher
- **Dark Mode**: Apple-inspired dark theme optimized for low-light coding
- **Light Mode**: Clean, professional light theme for bright environments
- **Auto Mode**: Automatically matches your system preferences
- Theme preference saved in localStorage

### Code Formatter
- One-click code beautification for HTML, CSS, and JavaScript
- Intelligent indentation and line breaks
- Preserves code functionality while improving readability
- Keyboard shortcut: `Ctrl + Shift + F`

### Library Import System
- Quick-add popular libraries with one click
- Includes:
  - CSS Frameworks: Bootstrap, Tailwind CSS, Animate.css
  - JavaScript Libraries: React, Vue.js, Alpine.js, jQuery
  - Utilities: Axios, Lodash, Chart.js, GSAP, Three.js
  - Icons: Font Awesome
- Search functionality to find libraries quickly
- Automatically inserts CDN links in proper locations

### Export to Platforms
- **CodePen**: Export with title and description
- **JSFiddle**: Direct export to JSFiddle editor
- **JSBin**: Open in JSBin with all panels populated
- One-click workflow for sharing on popular platforms

### URL-Based Sharing
- Generate shareable links with your code embedded
- Code compressed and encoded in URL hash
- Share via Twitter, LinkedIn, or direct link
- Copy link to clipboard with one click
- Load shared code automatically from URL
- No backend required - all client-side

### Virtual File System
- **File Explorer Sidebar**: Visual file tree with easy navigation
- **Multi-file Support**: Create and manage multiple HTML, CSS, and JS files
- **File Operations**:
  - Create new files with automatic type detection
  - Delete files with confirmation
  - Switch between files seamlessly
- **Auto-save**: Changes automatically saved to localStorage
- **Persistent Storage**: All files preserved between sessions
- **Collapsible Interface**: Hide/show file explorer to maximize workspace
- **Mobile-Friendly**: Responsive file explorer for mobile devices

## 📱 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Add more snippets
- Improve documentation
- Submit pull requests

## 📄 License

This project is free to use for personal and commercial projects. No attribution required.

## 🙏 Acknowledgments

- Emmet.js for abbreviation expansion
- jQuery team for the excellent library
- All contributors and users

## 📞 Support

Found a bug? Have a feature request? Please open an issue on GitHub.

---

**Made with ❤️ by the CodeDivs team**

*Happy coding!* 🚀
