/**
 * TodoService.ts
 *
 * This service implements the core business logic for managing todos.
 * It acts as an intermediary between the data model and the database,
 * handling all CRUD operations and search functionality.
 * It is part of the shared core module used by both the LM Studio Plugin
 * and the standalone MCP server entry points.
 *
 * WHY A SERVICE LAYER?
 * - Separates business logic from database operations
 * - Provides a clean API for the application to work with
 * - Makes it easier to change the database implementation later
 * - Encapsulates complex operations into simple method calls
 */
import { Todo, createTodo, CreateTodoSchema, UpdateTodoSchema } from "./Todo.js";
import { z } from "zod";
import { databaseService } from "./DatabaseService.js";

/**
 * TodoService Class
 */
class TodoService {
  /**
   * Create a new todo
   */
  async createTodo(data: z.infer<typeof CreateTodoSchema>): Promise<Todo> {
    const todo = createTodo(data);

    await databaseService.run(
      `INSERT INTO todos (id, title, description, completedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [todo.id, todo.title, todo.description, todo.completedAt, todo.createdAt, todo.updatedAt]
    );

    return todo;
  }

  /**
   * Get a todo by ID
   */
  async getTodo(id: string): Promise<Todo | undefined> {
    const row = await databaseService.getRow("SELECT * FROM todos WHERE id = ?", [id]);
    if (!row) return undefined;
    return this.rowToTodo(row);
  }

  /**
   * Get all todos
   */
  async getAllTodos(): Promise<Todo[]> {
    const rows = await databaseService.getRows("SELECT * FROM todos");
    return rows.map((row) => this.rowToTodo(row));
  }

  /**
   * Get all active (non-completed) todos
   */
  async getActiveTodos(): Promise<Todo[]> {
    const rows = await databaseService.getRows("SELECT * FROM todos WHERE completedAt IS NULL");
    return rows.map((row) => this.rowToTodo(row));
  }

  /**
   * Update a todo
   */
  async updateTodo(data: z.infer<typeof UpdateTodoSchema>): Promise<Todo | undefined> {
    const todo = await this.getTodo(data.id);
    if (!todo) return undefined;

    const updatedAt = new Date().toISOString();

    await databaseService.run(
      `UPDATE todos SET title = ?, description = ?, updatedAt = ? WHERE id = ?`,
      [data.title || todo.title, data.description || todo.description, updatedAt, todo.id]
    );

    return this.getTodo(todo.id);
  }

  /**
   * Mark a todo as completed
   */
  async completeTodo(id: string): Promise<Todo | undefined> {
    const todo = await this.getTodo(id);
    if (!todo) return undefined;

    const now = new Date().toISOString();

    await databaseService.run(
      `UPDATE todos SET completedAt = ?, updatedAt = ? WHERE id = ?`,
      [now, now, id]
    );

    return this.getTodo(id);
  }

  /**
   * Delete a todo
   */
  async deleteTodo(id: string): Promise<boolean> {
    const before = await this.getTodo(id);
    if (!before) return false;

    await databaseService.run("DELETE FROM todos WHERE id = ?", [id]);
    return true;
  }

  /**
   * Search todos by title (case-insensitive partial match)
   */
  async searchByTitle(title: string): Promise<Todo[]> {
    const rows = await databaseService.getRows(
      "SELECT * FROM todos WHERE title LIKE ? COLLATE NOCASE",
      [`%${title}%`]
    );
    return rows.map((row) => this.rowToTodo(row));
  }

  /**
   * Search todos by date (created on a specific date)
   */
  async searchByDate(dateStr: string): Promise<Todo[]> {
    const rows = await databaseService.getRows("SELECT * FROM todos WHERE createdAt LIKE ?", [
      `${dateStr}%`,
    ]);
    return rows.map((row) => this.rowToTodo(row));
  }

  /**
   * Generate a summary of active todos
   */
  async summarizeActiveTodos(): Promise<string> {
    const activeTodos = await this.getActiveTodos();

    if (activeTodos.length === 0) {
      return "No active todos found.";
    }

    const summary = activeTodos.map((todo) => `- ${todo.title}`).join("\n");
    return `# Active Todos Summary\n\nThere are ${activeTodos.length} active todos:\n\n${summary}`;
  }

  /**
   * Helper to convert a database row to a Todo object
   */
  private rowToTodo(row: any): Todo {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completedAt: row.completedAt,
      completed: row.completedAt !== null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Create a singleton instance for use throughout the application
export const todoService = new TodoService();
