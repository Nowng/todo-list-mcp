/**
 * toolsProvider.ts
 *
 * This file defines all MCP tools for the LM Studio Plugin.
 * It uses @lmstudio/sdk's `tool()` function to register tools that
 * LM Studio's built-in LLM can discover and call.
 *
 * This is the main entry point for the LM Studio Plugin experience.
 * The core business logic lives in src/core/ and is reused here.
 *
 * KEY DISTINCTION:
 * - This file is for the LM Studio Plugin (runs inside LM Studio).
 * - For a standalone MCP server, see src/mcp.ts instead.
 */
import { tool, Tool, ToolsProviderController } from "@lmstudio/sdk";
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
 * Tools Provider for LM Studio
 *
 * This async function is called by LM Studio to discover and load all
 * available tools. It returns an array of Tool objects.
 *
 * @param ctl - Controller provided by LM Studio for configuration access
 * @returns Array of Tool definitions
 */
export async function toolsProvider(ctl: ToolsProviderController): Promise<Tool[]> {
  /**
   * Note: Configuration values can be read here when needed.
   * Example:
   *   const perChatConfig = ctl.getPluginConfig(configSchematics);
   *   const dbFolder = perChatConfig.get("todoFolder");
   *
   * The config schemas (configSchematics and globalConfigSchematics)
   * are defined in src/config.ts and rendered as UI by LM Studio.
   */

  /**
   * Tool 1: create-todo
   */
  const createTodoTool = tool({
    name: "create-todo",
    description: "Create a new todo item with a title and markdown description.",
    parameters: {
      title: z.string().min(1, "Title is required").describe("The title of the todo"),
      description: z.string().min(1, "Description is required").describe("The markdown description of the todo"),
    },
    implementation: async ({ title, description }, { status }) => {
      status("Creating todo...");
      const result = await safeExecute(async () => {
        const validatedData = CreateTodoSchema.parse({ title, description });
        const newTodo = await todoService.createTodo(validatedData);
        return formatTodo(newTodo);
      }, "Failed to create todo");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(`✅ Todo Created:\n\n${result}`);
    },
  });

  /**
   * Tool 2: list-todos
   */
  const listTodosTool = tool({
    name: "list-todos",
    description: "List all todos (completed and active).",
    parameters: {},
    implementation: async (_, { status }) => {
      status("Listing todos...");
      const result = await safeExecute(async () => {
        const todos = await todoService.getAllTodos();
        return formatTodoList(todos);
      }, "Failed to list todos");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(result);
    },
  });

  /**
   * Tool 3: get-todo
   */
  const getTodoTool = tool({
    name: "get-todo",
    description: "Get a specific todo by its ID (UUID).",
    parameters: {
      id: z.string().uuid("Invalid Todo ID").describe("The UUID of the todo to retrieve"),
    },
    implementation: async ({ id }, { status }) => {
      status("Fetching todo...");
      const result = await safeExecute(async () => {
        const todo = await todoService.getTodo(id);
        if (!todo) throw new Error(`Todo with ID ${id} not found`);
        return formatTodo(todo);
      }, "Failed to get todo");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(result);
    },
  });

  /**
   * Tool 4: update-todo
   */
  const updateTodoTool = tool({
    name: "update-todo",
    description: "Update a todo's title or description.",
    parameters: {
      id: z.string().uuid("Invalid Todo ID").describe("The UUID of the todo to update"),
      title: z.string().min(1, "Title is required").optional().describe("The new title (at least one required)"),
      description: z.string().min(1, "Description is required").optional().describe("The new description (at least one required)"),
    },
    implementation: async ({ id, title, description }, { status }) => {
      status("Updating todo...");
      const result = await safeExecute(async () => {
        const validatedData = UpdateTodoSchema.parse({ id, title, description });
        if (!title && !description) throw new Error("At least one field (title or description) must be provided");
        const updatedTodo = await todoService.updateTodo(validatedData);
        if (!updatedTodo) throw new Error(`Todo with ID ${id} not found`);
        return formatTodo(updatedTodo);
      }, "Failed to update todo");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(`✅ Todo Updated:\n\n${result}`);
    },
  });

  /**
   * Tool 5: complete-todo
   */
  const completeTodoTool = tool({
    name: "complete-todo",
    description: "Mark a todo as completed.",
    parameters: {
      id: z.string().uuid("Invalid Todo ID").describe("The UUID of the todo to complete"),
    },
    implementation: async ({ id }, { status }) => {
      status("Completing todo...");
      const result = await safeExecute(async () => {
        const validatedData = CompleteTodoSchema.parse({ id });
        const completedTodo = await todoService.completeTodo(validatedData.id);
        if (!completedTodo) throw new Error(`Todo with ID ${id} not found`);
        return formatTodo(completedTodo);
      }, "Failed to complete todo");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(`✅ Todo Completed:\n\n${result}`);
    },
  });

  /**
   * Tool 6: delete-todo
   */
  const deleteTodoTool = tool({
    name: "delete-todo",
    description: "Delete a todo permanently.",
    parameters: {
      id: z.string().uuid("Invalid Todo ID").describe("The UUID of the todo to delete"),
    },
    implementation: async ({ id }, { status }) => {
      status("Deleting todo...");
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
    },
  });

  /**
   * Tool 7: search-todos-by-title
   */
  const searchByTitleTool = tool({
    name: "search-todos-by-title",
    description: "Search todos by title (case-insensitive partial match).",
    parameters: {
      title: z.string().min(1, "Search term is required").describe("The search term to find in todo titles"),
    },
    implementation: async ({ title }, { status }) => {
      status("Searching todos...");
      const result = await safeExecute(async () => {
        const validatedData = SearchTodosByTitleSchema.parse({ title });
        const todos = await todoService.searchByTitle(validatedData.title);
        return formatTodoList(todos);
      }, "Failed to search todos");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(result);
    },
  });

  /**
   * Tool 8: search-todos-by-date
   */
  const searchByDateTool = tool({
    name: "search-todos-by-date",
    description: "Search todos by creation date (format: YYYY-MM-DD).",
    parameters: {
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").describe("The date to search in YYYY-MM-DD format"),
    },
    implementation: async ({ date }, { status }) => {
      status("Searching todos by date...");
      const result = await safeExecute(async () => {
        const validatedData = SearchTodosByDateSchema.parse({ date });
        const todos = await todoService.searchByDate(validatedData.date);
        return formatTodoList(todos);
      }, "Failed to search todos by date");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(result);
    },
  });

  /**
   * Tool 9: list-active-todos
   */
  const listActiveTodosTool = tool({
    name: "list-active-todos",
    description: "List all non-completed (active) todos.",
    parameters: {},
    implementation: async (_, { status }) => {
      status("Listing active todos...");
      const result = await safeExecute(async () => {
        const todos = await todoService.getActiveTodos();
        return formatTodoList(todos);
      }, "Failed to list active todos");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(result);
    },
  });

  /**
   * Tool 10: summarize-active-todos
   */
  const summarizeActiveTodosTool = tool({
    name: "summarize-active-todos",
    description: "Generate a summary of all active (non-completed) todos.",
    parameters: {},
    implementation: async (_, { status }) => {
      status("Summarizing active todos...");
      const result = await safeExecute(async () => {
        return todoService.summarizeActiveTodos();
      }, "Failed to summarize active todos");

      if (result instanceof Error) return createErrorResponse(result.message);
      return createSuccessResponse(result);
    },
  });

  return [
    createTodoTool,
    listTodosTool,
    getTodoTool,
    updateTodoTool,
    completeTodoTool,
    deleteTodoTool,
    searchByTitleTool,
    searchByDateTool,
    listActiveTodosTool,
    summarizeActiveTodosTool,
  ];
}
