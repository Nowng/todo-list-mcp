# Todo List MCP Server — LM Studio Plugin Edition

> **A comprehensive todo list MCP server ported to be compatible with LM Studio Plugins.**
> This project is a port of the original [RegiByte/todo-list-mcp](https://github.com/RegiByte/todo-list-mcp) repository, adapted to run inside LM Studio's built-in Node.js environment while preserving all original functionality.

<a href="https://glama.ai/mcp/servers/kh39rjpplx">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/kh39rjpplx/badge" alt="Todo List Server MCP server" />
</a>

---

## 📖 Overview

This project provides a **Model Context Protocol (MCP)** server that offers a complete todo list management system. It has been ported from the original [RegiByte/todo-list-mcp](https://github.com/RegiByte/todo-list-mcp) repository to be compatible with **LM Studio Plugins**, enabling AI models running inside LM Studio to discover and use todo management tools directly.

The project follows the [LM Studio Plugin Development Guide](https://docs.lmstudio.dev) for TypeScript-based plugins, using `@lmstudio/sdk` for the plugin entry point while retaining a standalone MCP server entry for use with other MCP clients.

### Key Features

- **10 MCP tools** for full todo lifecycle management
- **SQLite persistence** — uses `sql.js` (pure JS, no native compilation) for LM Studio compatibility
- **LM Studio Plugin compatible** — runs inside LM Studio's built-in Node.js environment
- **Standalone MCP server** — also works with Claude Desktop, Cursor, and other MCP clients
- **Type-safe** — built with TypeScript and Zod validation
- **Educational** — heavily commented source code and included learning guide

---

## 🛠️ Tools

This MCP server exposes the following 10 tools:

| # | Tool Name | Description |
|---|-----------|-------------|
| 1 | `create-todo` | Create a new todo item with a title and markdown description |
| 2 | `list-todos` | List all todos (both completed and active) |
| 3 | `get-todo` | Get a specific todo by its ID (UUID) |
| 4 | `update-todo` | Update a todo's title or description |
| 5 | `complete-todo` | Mark a todo as completed |
| 6 | `delete-todo` | Delete a todo permanently |
| 7 | `search-todos-by-title` | Search todos by title (case-insensitive partial match) |
| 8 | `search-todos-by-date` | Search todos by creation date (format: YYYY-MM-DD) |
| 9 | `list-active-todos` | List all non-completed (active) todos |
| 10 | `summarize-active-todos` | Generate a summary of all active (non-completed) todos |

---

## 📦 Installation

### Prerequisites

1. **LM Studio** v0.3.17 or higher (with built-in Node.js v22.x)
2. **LM Studio CLI** (`lms`) — verify with `lms --help`
3. The project files cloned locally

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/RegiByte/todo-list-mcp.git
cd todo-list-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Verify the Build

```bash
npm run typecheck   # Type-check with zero errors
npm run build       # Compile to dist/
```

---

## 🚀 Usage

### Option 1: Run as an LM Studio Plugin (Recommended)

1. Open LM Studio.
2. Navigate to the **Plugins** section.
3. Install or load this plugin from the local directory.
4. The 10 todo tools will be auto-discovered and available for use with the built-in LLM.

The plugin provides:
- **Per-chat configuration** — set a per-chat database folder and toggle completed-todo visibility.
- **Global configuration** — set a global default database path.

### Option 2: Run as a Standalone MCP Server

If you prefer to use this with **Claude Desktop**, **Cursor**, or any other MCP-compatible client:

```bash
# Build the project
npm run build

# Start the MCP server (outputs JSON-RPC to stdout)
npm run mcp
```

#### Configuring with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "todo-list-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/todo-list-mcp/dist/mcp.js"]
    }
  }
}
```

#### Configuring with Cursor

1. Go to **Cursor Settings** → **MCP**.
2. Add a new MCP server with **command** type.
3. Set the command to: `node` and the args to the absolute path of `dist/mcp.js`.
4. Example: `node /absolute/path/to/todo-list-mcp/dist/mcp.js`

---

## 💡 Example Commands

Once configured, you can try prompts such as:

- *"Create a todo to learn MCP with a description explaining why MCP is useful"*
- *"List all my active todos"*
- *"Create a todo for tomorrow's meeting with details about the agenda in markdown"*
- *"Mark my learning MCP todo as completed"*
- *"Summarize all my active todos"*
- *"Search todos I created on 2025-01-15"*

---

## 📁 Project Structure

```
todo-list-mcp/
├── manifest.json           # Plugin metadata (LM Studio)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── dist/                   # Compiled JavaScript (auto-generated)
│   ├── index.js            # Plugin entry point
│   ├── toolsProvider.js    # LM Studio tool definitions
│   ├── config.js           # UI configuration schemas
│   ├── mcp.js              # Standalone MCP server entry
│   └── core/               # Shared business logic
│       ├── Todo.ts
│       ├── DatabaseService.ts
│       ├── TodoService.ts
│       └── formatters.ts
├── src/
│   ├── index.ts            # Plugin entry point (exports toolsProvider, configSchematics)
│   ├── toolsProvider.ts    # LM Studio tool definitions (using @lmstudio/sdk)
│   ├── config.ts           # UI configuration schemas (createConfigSchematics)
│   ├── mcp.ts              # Standalone MCP server (using @modelcontextprotocol/sdk)
│   └── core/               # Shared business logic (used by both entry points)
├── GUIDE.md                # Original learning guide
├── SKILL.md                # 4B LLM skill documentation
├── README.md               # This file
└── LICENSE                 # MIT License
```

---

### Module Resolution Fix

This project uses two `package.json` files to handle different module requirements:

1. **Root `package.json`**: Does **not** have `"type": "module"`. This allows Node.js to treat `.js` files as CommonJS by default, which is required for the `lms dev` workflow (esbuild bundles use `require()`).
2. **`dist/package.json`**: Has `"type": "module"`. This ensures Node.js treats the compiled `dist/` files as ES modules, since they use ES module syntax (`import`/`export`).

This dual approach ensures both the LM Studio Plugin development workflow (`lms dev`) and the standalone MCP server (`npm run mcp`) work correctly.

---

## 🔧 Port Summary

This section documents the migration from the original standalone MCP server to an LM Studio Plugin-compatible project.

### What Changed

| Aspect | Original | Ported |
|--------|----------|--------|
| **Primary Runtime** | Standalone process (stdio) | LM Studio Plugin (inside LM Studio) |
| **SDK Used** | `@modelcontextprotocol/sdk` only | `@lmstudio/sdk` (plugin) + `@modelcontextprotocol/sdk` (standalone MCP) |
| **Entry Point** | `src/index.ts` (MCP server) | `src/index.ts` (plugin) + `src/mcp.ts` (standalone MCP) |
| **Tool Definition** | `server.tool()` from MCP SDK | `tool()` from `@lmstudio/sdk` (via `toolsProvider.ts`) |
| **Config UI** | None | `createConfigSchematics()` for per-chat + global UI |
| **Database** | `better-sqlite3` (native binary) | `sql.js` (pure JS WASM, no native compilation) |
| **Project Layout** | Flat `src/` with models/services/utils | `src/core/` shared module + dual entry points |

### Port Process

1. **Analyzed the original project** — Reviewed all source files in [RegiByte/todo-list-mcp](https://github.com/RegiByte/todo-list-mcp) to understand the 10 tools, SQLite persistence, and error-handling patterns.
2. **Created the LM Studio Plugin structure** — Set up `manifest.json`, `package.json`, and `tsconfig.json` per the official LM Studio Plugin Development Guide.
3. **Moved core logic to `src/core/`** — Relocated `Todo.ts`, `DatabaseService.ts`, `TodoService.ts`, and `formatters.ts` into a shared `src/core/` module, following the guide's "write core once, two entry points" best practice.
4. **Built `src/toolsProvider.ts`** — Ported all 10 tools to use `@lmstudio/sdk`'s `tool()` function with `zod` parameter schemas and the required `{ signal, status, warn }` implementation signature.
5. **Created `src/config.ts`** — Defined per-chat and global configuration schemas using `createConfigSchematics()` for LM Studio's auto-generated UI.
6. **Created `src/mcp.ts`** — Retained a standalone MCP server entry point using `@modelcontextprotocol/sdk` for compatibility with Claude Desktop, Cursor, and other MCP clients.
7. **Updated `src/index.ts`** — Rewrote as the LM Studio Plugin entry point, exporting `toolsProvider`, `configSchematics`, and `globalConfigSchematics`.
8. **Updated `README.md`** — Documented the LM Studio Plugin version, installation, usage, tools, port summary, and credits.
9. **Created `SKILL.md`** — Produced an LLM-friendly skill document for 4B-parameter models.
10. **Verified the build** — Confirmed `npm run build` compiles cleanly and the MCP server responds to tool/list requests with all 10 tools registered.

### Key Design Decisions

- **MIT License preserved** — The original MIT License is retained unchanged.
- **All 10 tools retained** — No functionality was removed during the port.
- **Dual-purpose project** — The project works both as an LM Studio Plugin and as a standalone MCP server.
- **Core logic shared** — Business logic lives in `src/core/` and is reused by both entry points, avoiding duplication.

---

## 📚 Learning from This Project

This project is designed as an educational resource. To get the most out of it:

1. Read the [GUIDE.md](GUIDE.md) for a comprehensive explanation of the original design.
2. Read the [SKILL.md](SKILL.md) for LLM-friendly usage instructions and practical scenarios.
3. Study the heavily commented source code in `src/core/` to understand implementation details.
4. Experiment with adding your own tools or extending the existing ones.

---

## 📄 License

This project is licensed under the **MIT License**. The original MIT License text is included in the `LICENSE` file and is retained from the original [RegiByte/todo-list-mcp](https://github.com/RegiByte/todo-list-mcp) repository.

---

## 🙏 Credits & Acknowledgements

We would like to express our deepest gratitude to the original project:

> **[RegiByte/todo-list-mcp](https://github.com/RegiByte/todo-list-mcp)**  
> Author: **Reginaldo Junior (RegiByte)**  
> License: **MIT**

The original repository provided a clean, well-structured, and educational example of an MCP server implementation. This port builds upon that foundation to bring todo list functionality to the LM Studio Plugin ecosystem.

---

*Ported and maintained with ❤️ for the LM Studio community.*
