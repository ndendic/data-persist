# Datastar Persist Plugin

Automatically persist [Datastar](https://data-star.dev) signals to browser storage (localStorage or sessionStorage) with support for wildcards and automatic restoration on page load.

## Features

- **Automatic Persistence**: Signals are automatically saved to storage whenever they change
- **Flexible Storage Options**: Choose between localStorage (persistent) or sessionStorage (tab-specific)
- **Wildcard Support**: Persist all signals or use patterns to persist groups of related signals
- **Custom Storage Keys**: Namespace your persisted data with custom key prefixes
- **Automatic Restoration**: Persisted values are automatically restored when the page loads
- **Zero Configuration**: Works out of the box with sensible defaults
- **TypeScript**: Built with TypeScript for type safety and better developer experience

## Installation

### CDN (Recommended)

Add the following to your HTML `<head>`:

```html
<script type="importmap">
  {
    "imports": {
      "datastar": "https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.6/bundles/datastar.js"
    }
  }
</script>
<script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/data-persist@main/dist/index.js"></script>
```

### NPM/PNPM (For Build Systems)

```bash
pnpm add github:starfederation/data-persist
```

## Usage

### Basic Example

Persist specific signals to localStorage:

```html
<div data-signals:username="''" data-signals:theme="'dark'">
  <!-- Persist specific signals -->
  <div data-persist="username,theme"></div>

  <input type="text" data-model="username" placeholder="Enter username">
  <select data-model="theme">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</div>
```

### Persist All Signals

Use an empty value to persist all signals on the element:

```html
<div data-signals:user="{ name: '', email: '' }" data-signals:count="0">
  <!-- Persist everything -->
  <div data-persist></div>

  <input data-model="user.name">
  <input data-model="user.email">
  <button data-on-click="$count++">Count: <span data-text="$count"></span></button>
</div>
```

### Session Storage

Use the `__session` modifier to persist to sessionStorage instead of localStorage:

```html
<div data-signals:tempData="''">
  <!-- Persist to sessionStorage (cleared when tab closes) -->
  <div data-persist__session="tempData"></div>

  <input data-model="tempData">
</div>
```

### Custom Storage Key

Namespace your persisted data with a custom key prefix:

```html
<div data-signals:settings="{ darkMode: false }">
  <!-- Will be stored as "datastar-myapp" in localStorage -->
  <div data-persist:myapp="settings"></div>
</div>
```

### Wildcard Pattern Example

```html
<div
  data-signals:user_name="''"
  data-signals:user_email="''"
  data-signals:user_theme="'dark'"
  data-signals:app_version="'1.0'">

  <!-- Persist only signals starting with "user_" -->
  <div data-persist="user_*"></div>

  <input data-model="user_name">
  <input data-model="user_email">
  <select data-model="user_theme">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</div>
```

## API Reference

### Attributes

#### `data-persist`

Persist signals to localStorage.

**Syntax:**
- `data-persist="signal1,signal2"` - Persist specific signals (comma-separated)
- `data-persist` - Persist all signals on the element
- `data-persist="prefix_*"` - Wildcard pattern (persist all signals matching pattern)

**Example:**
```html
<div data-persist="username,email"></div>
```

#### `data-persist:key`

Persist signals with a custom storage key prefix.

**Syntax:**
- `data-persist:customKey="signal1,signal2"`

**Example:**
```html
<div data-persist:myapp="settings"></div>
<!-- Stored in localStorage as "datastar-myapp" -->
```

### Modifiers

#### `__session`

Use sessionStorage instead of localStorage. Data is cleared when the browser tab closes.

**Example:**
```html
<div data-persist__session="tempData"></div>
```

#### `__key:customKey`

Alternative syntax for custom storage key prefix.

**Example:**
```html
<div data-persist__key:myapp="settings"></div>
```

### Storage Behavior

#### localStorage
- Data persists across browser sessions
- Shared across all tabs and windows from the same origin
- Persists until explicitly cleared (via browser settings or `localStorage.clear()`)
- Default storage method

**Storage Key Format:** `datastar` or `datastar-{customKey}`

**Example:**
```javascript
// Stored in localStorage as:
{
  "datastar": {
    "username": "john",
    "theme": "dark"
  }
}
```

#### sessionStorage
- Data is cleared when the browser tab closes
- Each tab has its own separate storage
- Survives page reloads but not tab closure
- Use for temporary, tab-specific data

**Example:**
```html
<div data-persist__session="formData"></div>
```

## How It Works

1. **Initialization**: When the `data-persist` attribute is processed, the plugin immediately loads any previously saved data from storage
2. **Restoration**: Saved signal values are restored using Datastar's `mergePatch` API in a batched update for optimal performance
3. **Monitoring**: An effect is set up to watch the specified signals for changes
4. **Persistence**: Whenever a signal value changes, it's immediately saved to storage (localStorage or sessionStorage)
5. **Merging**: New values are merged with existing storage data, preserving other persisted signals

## Browser Compatibility

This plugin requires:
- ES6 module support
- Web Storage API (localStorage/sessionStorage)
- Browser support for import maps

The plugin includes storage availability detection and will gracefully fail if storage is not available (e.g., in private/incognito mode with storage disabled).

## Requirements

- **Datastar**: v1.0.0-RC.6 or higher
- Modern browser with ES module support
- Web Storage API enabled

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS version)
- [pnpm](https://pnpm.io/) package manager

### Setup

```bash
# Install dependencies
pnpm install

# Build plugin
pnpm build

# Development mode (with file watching and local server)
pnpm watch
```

### Project Structure

```
src/
  index.ts      # Main plugin source code
dist/
  index.js      # Compiled, minified plugin bundle
index.html      # Demo page with examples
```

### Building from Source

The plugin is built using esbuild:

```bash
pnpm build
```

This compiles the TypeScript source to a minified ES module in `dist/index.js`.

## Demo

View the live demo: [https://regaez.github.io/datastar-plugin-starter/](https://regaez.github.io/datastar-plugin-starter/)

Or run locally:

```bash
pnpm watch
# Open http://localhost:8000 in your browser
```

## Advanced Usage

### Multiple Storage Keys

You can use different storage keys for different parts of your application:

```html
<div data-signals:userPrefs="{ theme: 'dark' }">
  <div data-persist:preferences="userPrefs"></div>
</div>

<div data-signals:formData="{ draft: '' }">
  <div data-persist:drafts="formData"></div>
</div>

<!-- Results in localStorage:
{
  "datastar-preferences": { "userPrefs": { "theme": "dark" } },
  "datastar-drafts": { "formData": { "draft": "" } }
}
-->
```

### Combining with Other Datastar Features

The persist plugin works seamlessly with other Datastar features:

```html
<div
  data-signals:todos="[]"
  data-signals:filter="'all'"
  data-persist="todos,filter">

  <!-- Form with validation -->
  <input
    type="text"
    data-model="newTodo"
    data-on-keydown.enter="$todos.push($newTodo); $newTodo = ''">

  <!-- Filtered list -->
  <div data-for="todo in $todos.filter(t => $filter === 'all' || t.status === $filter)">
    <span data-text="todo.text"></span>
  </div>

  <!-- Filter buttons -->
  <button data-on-click="$filter = 'all'">All</button>
  <button data-on-click="$filter = 'active'">Active</button>
  <button data-on-click="$filter = 'completed'">Completed</button>
</div>
```

## Troubleshooting

### Signals Not Persisting

1. Check that the signal names match exactly (case-sensitive)
2. Verify signals are declared with `data-signals:signalName` on the same element or a parent
3. Check browser console for errors
4. Verify storage is not disabled (private browsing mode may restrict storage)

### Storage Quota Exceeded

If you're persisting large amounts of data:
- Consider using sessionStorage for temporary data
- Implement data cleanup/expiration logic
- Be selective about which signals to persist

### Values Not Restoring

1. Ensure the `data-persist` element is present when the page loads
2. Check that signal initial values are defined before persistence runs
3. Verify the storage key matches (check localStorage/sessionStorage in DevTools)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Credits

Built with [Datastar](https://data-star.dev) by Thomas Threadgold
