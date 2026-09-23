/**
 * config.ts
 *
 * This file defines the UI configuration schemas for the LM Studio Plugin.
 * LM Studio auto-generates the configuration UI from these schemas.
 *
 * - Per-chat config: applies only to the current chat (e.g., tool toggles).
 * - Global config: applies to all chats (e.g., global database settings).
 *
 * NOTE: We do NOT build custom HTML/React UIs. LM Studio generates the UI
 * from these schemas automatically.
 */
import { createConfigSchematics } from "@lmstudio/sdk";

/**
 * Per-chat configuration schema.
 *
 * These settings apply only to the current chat session.
 * They are useful for: folder names, tool toggles, result limits.
 */
export const configSchematics = createConfigSchematics()
  .field(
    "todoFolder",
    "string",
    {
      displayName: "Todo Database Folder",
      subtitle: "Folder where the SQLite database file is stored for this chat.",
    },
    "" // Default to empty (uses default path in home directory)
  )
  .field(
    "showCompleted",
    "boolean",
    {
      displayName: "Show Completed Todos",
      subtitle: "Include completed todos in list results.",
    },
    true // Default to showing completed todos
  )
  .build();

/**
 * Global configuration schema.
 *
 * These settings apply to all chats globally.
 * They are useful for: API keys, global URLs, default paths.
 */
export const globalConfigSchematics = createConfigSchematics()
  .field(
    "dbPath",
    "string",
    {
      displayName: "Default Database Path",
      subtitle: "Global default path for the SQLite database. Empty uses the default location in your home directory.",
    },
    "" // Default to empty (uses default path)
  )
  .build();
