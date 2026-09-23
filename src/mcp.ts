/**
 * mcp.ts
 *
 * This file implements the standalone MCP server entry point.
 * It uses @modelcontextprotocol/sdk to expose the same todo tools
 * as an external MCP server that can be used with any MCP client
 * (e.g., Claude Desktop, Cursor).
 *
 * This allows the project to serve dual purposes:
 * 1. LM Studio Plugin (via src/index.ts + toolsProvider.ts)
 * 2. Standalone MCP Server (via this file)
 *
 * MCP RULE: This server outputs only JSON-RPC to stdout.
 * All debug logs go to stderr (console.error).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import shared core logic
import {
  CreateTodoSchema,
  UpdateTodoSchema,
  CompleteTodoSchema,
  DeleteTodoSchema,
  SearchTodosByTitleSchema,
  SearchTodosByDateSchema,
} from "./core/Todo.js";
import { todoService } from "./core/TodoService.js";
import { databaseService } from "./core/DatabaseService.js";
import {
  createSuccessResponse,
  createErrorResponse,
  formatTodo,
  formatTodoList,
} from "./core/formatters.js";

/**
 * Helper function to safely execute async operations.
 * Handles both sync and async callbacks.
 */
async function safeExecute<T>(operation: () => Promise<T> | T, errorMessage: string): Promise<T | Error> {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    console.error(errorMessage, error);
    if (error instanceof Error) {
      return new Error(`${errorMessage}: ${error.message}`);
    }
    return new Error(errorMessage);
  }
}

/**
 * Create the MCP server
 */
const server = new McpServer(
  { name: "todo-list-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/**
 * Tool 1: create-todo
 */
server.tool(
  "create-todo",
  "Create a new todo item with a title and markdown description.",
  {
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
  },
  async ({ title, description }) => {
    const result = await safeExecute(async () => {
      const validatedData = CreateTodoSchema.parse({ title, description });
      const newTodo = await todoService.createTodo(validatedData);
      return formatTodo(newTodo);
    }, "Failed to create todo");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(`✅ Todo Created:\n\n${result}`);
  }
);

/**
 * Tool 2: list-todos
 */
server.tool(
  "list-todos",
  "List all todos (completed and active).",
  {},
  async () => {
    const result = await safeExecute(async () => {
      const todos = await todoService.getAllTodos();
      return formatTodoList(todos);
    }, "Failed to list todos");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(result);
  }
);

/**
 * Tool 3: get-todo
 */
server.tool(
  "get-todo",
  "Get a specific todo by its ID (UUID).",
  { id: z.string().uuid("Invalid Todo ID") },
  async ({ id }) => {
    const result = await safeExecute(async () => {
      const todo = await todoService.getTodo(id);
      if (!todo) throw new Error(`Todo with ID ${id} not found`);
      return formatTodo(todo);
    }, "Failed to get todo");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(result);
  }
);

/**
 * Tool 4: update-todo
 */
server.tool(
  "update-todo",
  "Update a todo's title or description.",
  {
    id: z.string().uuid("Invalid Todo ID"),
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
  },
  async ({ id, title, description }) => {
    const result = await safeExecute(async () => {
      const validatedData = UpdateTodoSchema.parse({ id, title, description });
      if (!title && !description) throw new Error("At least one field (title or description) must be provided");
      const updatedTodo = await todoService.updateTodo(validatedData);
      if (!updatedTodo) throw new Error(`Todo with ID ${id} not found`);
      return formatTodo(updatedTodo);
    }, "Failed to update todo");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(`✅ Todo Updated:\n\n${result}`);
  }
);

/**
 * Tool 5: complete-todo
 */
server.tool(
  "complete-todo",
  "Mark a todo as completed.",
  { id: z.string().uuid("Invalid Todo ID") },
  async ({ id }) => {
    const result = await safeExecute(async () => {
      const validatedData = CompleteTodoSchema.parse({ id });
      const completedTodo = await todoService.completeTodo(validatedData.id);
      if (!completedTodo) throw new Error(`Todo with ID ${id} not found`);
      return formatTodo(completedTodo);
    }, "Failed to complete todo");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(`✅ Todo Completed:\n\n${result}`);
  }
);

/**
 * Tool 6: delete-todo
 */
server.tool(
  "delete-todo",
  "Delete a todo permanently.",
  { id: z.string().uuid("Invalid Todo ID") },
  async ({ id }) => {
    const result = await safeExecute(async () => {
      const validatedData = DeleteTodoSchema.parse({ id });
      const todo = await todoService.getTodo(validatedData.id);
      if (!todo) throw new Error(`Todo with ID ${id} not found`);
      const success = await todoService.deleteTodo(validatedData.id);
      if (!success) throw new Error(`Failed to delete todo with ID ${id}`);
      return todo.title;
    }, "Failed to delete todo");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(`✅ Todo Deleted: "${result}"`);
  }
);

/**
 * Tool 7: search-todos-by-title
 */
server.tool(
  "search-todos-by-title",
  "Search todos by title (case-insensitive partial match).",
  { title: z.string().min(1, "Search term is required") },
  async ({ title }) => {
    const result = await safeExecute(async () => {
      const validatedData = SearchTodosByTitleSchema.parse({ title });
      const todos = await todoService.searchByTitle(validatedData.title);
      return formatTodoList(todos);
    }, "Failed to search todos");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(result);
  }
);

/**
 * Tool 8: search-todos-by-date
 */
server.tool(
  "search-todos-by-date",
  "Search todos by creation date (format: YYYY-MM-DD).",
  { date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format") },
  async ({ date }) => {
    const result = await safeExecute(async () => {
      const validatedData = SearchTodosByDateSchema.parse({ date });
      const todos = await todoService.searchByDate(validatedData.date);
      return formatTodoList(todos);
    }, "Failed to search todos by date");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(result);
  }
);

/**
 * Tool 9: list-active-todos
 */
server.tool(
  "list-active-todos",
  "List all non-completed (active) todos.",
  {},
  async () => {
    const result = await safeExecute(async () => {
      const todos = await todoService.getActiveTodos();
      return formatTodoList(todos);
    }, "Failed to list active todos");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(result);
  }
);

/**
 * Tool 10: summarize-active-todos
 */
server.tool(
  "summarize-active-todos",
  "Generate a summary of all active (non-completed) todos.",
  {},
  async () => {
    const result = await safeExecute(async () => {
      return todoService.summarizeActiveTodos();
    }, "Failed to summarize active todos");

    if (result instanceof Error) return createErrorResponse(result.message);
    return createSuccessResponse(result);
  }
);

/**
 * Main function to start the MCP server
 */
async function main() {
  console.error("Starting Todo List MCP Server...");
  try {
    process.on("SIGINT", async () => {
      console.error("Shutting down...");
      await databaseService.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.error("Shutting down...");
      await databaseService.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Todo List MCP Server running on stdio transport");
  } catch (error) {
    console.error("Failed to start Todo List MCP Server:", error);
    await databaseService.close();
    process.exit(1);
  }
}

main();
