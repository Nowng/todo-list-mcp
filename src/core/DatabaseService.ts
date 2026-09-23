/**
 * DatabaseService.ts
 *
 * This file implements a lightweight SQLite database service for the Todo application.
 * It uses sql.js (pure JavaScript SQLite, no native compilation) so it works with
 * any Node.js version — including LM Studio's bundled Node.js.
 * It is part of the shared core module used by both the LM Studio Plugin and the
 * standalone MCP server entry points.
 *
 * WHY SQL.JS (NOT BETTER-SQLITE3)?
 * - sql.js is a pure JavaScript implementation of SQLite (WASM-based)
 * - No native compilation needed — works with any Node.js version
 * - Critical for LM Studio compatibility where the bundled Node.js ABI
 *   may differ from the system Node.js
 */
import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import path from "path";
import os from "os";
import fs from "fs";

/**
 * Database configuration defaults
 */
const DEFAULT_DB_FOLDER = path.join(os.homedir(), ".todo-list-mcp");
const DEFAULT_DB_FILE = "todos.sqlite";

/**
 * Application configuration object
 */
export const config = {
  db: {
    folder: process.env.TODO_DB_FOLDER || DEFAULT_DB_FOLDER,
    filename: process.env.TODO_DB_FILE || DEFAULT_DB_FILE,
    get path() {
      return path.join(this.folder, this.filename);
    },
  },
};

/**
 * Ensure the database folder exists.
 */
export function ensureDbFolder(): void {
  if (!fs.existsSync(config.db.folder)) {
    fs.mkdirSync(config.db.folder, { recursive: true });
  }
}

/**
 * Load existing database file as Uint8Array, or return empty buffer.
 */
function loadExistingDatabase(): Uint8Array {
  if (fs.existsSync(config.db.path)) {
    return new Uint8Array(fs.readFileSync(config.db.path));
  }
  return new Uint8Array(0);
}

/**
 * Save the database to disk by exporting as Uint8Array.
 */
function saveDatabase(db: Database): void {
  const data = db.export();
  fs.writeFileSync(config.db.path, Buffer.from(data));
}

/**
 * DatabaseService Class
 *
 * This service manages the SQLite database connection and schema using sql.js.
 * Uses lazy async initialization — the database is created on first use.
 */
class DatabaseService {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Lazy initialize sql.js and open/create the database.
   * Called automatically on first database operation.
   */
  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.db) return;

    this.initPromise = (async () => {
      ensureDbFolder();

      const SQL = await initSqlJs();

      const existingData = loadExistingDatabase();
      this.db = new SQL.Database(existingData);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          completedAt TEXT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      saveDatabase(this.db);
    })();

    return this.initPromise;
  }

  /**
   * Run a SQL statement with parameters. Returns the number of affected rows.
   */
  async run(sql: string, params?: any[]): Promise<number> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    const changes = this.db.getRowsModified();
    saveDatabase(this.db);
    return changes;
  }

  /**
   * Get a single row from a SQL query.
   */
  async getRow(sql: string, params?: any[]): Promise<any> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  }

  /**
   * Get all rows from a SQL query.
   */
  async getRows(sql: string, params?: any[]): Promise<any[]> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /**
   * Get the database instance (for advanced operations).
   */
  getDb(): Database | null {
    return this.db;
  }

  /**
   * Close the database and save to disk.
   */
  async close(): Promise<void> {
    if (this.db) {
      saveDatabase(this.db);
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * Re-export the database to disk.
   */
  async save(): Promise<void> {
    await this.initialize();
    if (this.db) {
      saveDatabase(this.db);
    }
  }
}

// Create a singleton instance that will be used throughout the application
export const databaseService = new DatabaseService();
