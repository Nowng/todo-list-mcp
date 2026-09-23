# SKILL: Todo List MCP Server

> **A guide for small language models (4B parameters) on how to use the todo-list-mcp tools.**
> This document explains each tool clearly, shows usage rules, gives examples, and describes practical scenarios you can use every day.

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Available Tools](#available-tools)
3. [General Rules](#general-rules)
4. [Tool Details and Examples](#tool-details-and-examples)
5. [Practical Scenarios](#practical-scenarios)
6. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)

---

## What Is This?

This is a **todo list tool set** (called "MCP server") that helps you manage tasks. You can:

- **Add** new tasks
- **List** tasks
- **Update** task titles or descriptions
- **Complete** tasks (mark as done)
- **Delete** tasks
- **Search** tasks by title or by date
- **Summarize** active (not-yet-done) tasks

You will use these tools when a user asks you to plan, organize, track, or review their tasks.

---

## Available Tools

There are **10 tools** in total:

| # | Tool Name | What It Does |
|---|-----------|-------------|
| 1 | `create-todo` | Add a new task with a title and description |
| 2 | `list-todos` | Show ALL tasks (done and not done) |
| 3 | `get-todo` | Show ONE specific task by its ID |
| 4 | `update-todo` | Change a task's title or description |
| 5 | `complete-todo` | Mark a task as done |
| 6 | `delete-todo` | Remove a task forever |
| 7 | `search-todos-by-title` | Find tasks whose title contains your search word |
| 8 | `search-todos-by-date` | Find tasks created on a specific date |
| 9 | `list-active-todos` | Show only tasks that are NOT done yet |
| 10 | `summarize-active-todos` | Give a short summary of tasks not done yet |

---

## General Rules

Follow these rules every time you use the tools:

1. **Always read first.** Before making changes, check what tasks already exist. Use `list-todos` or `list-active-todos` to see the current state.

2. **Use IDs to identify tasks.** Each task has a unique ID (a long string of letters and numbers). To update, complete, or delete a task, you MUST provide its ID.

3. **Title is required for `create-todo`.** Every new task needs a title. The description is also required and can include markdown (like `# headings`, `- lists`, `**bold**`).

4. **At least one field for `update-todo`.** When updating, you must provide at least one of: `title` or `description`. You cannot update with nothing.

5. **Date format for `search-todos-by-date`.** Use `YYYY-MM-DD` format. Example: `2025-01-15` (not "January 15" or "01/15/2025").

6. **Search is partial and case-insensitive.** `search-todos-by-title` with the word "meeting" will find tasks with "Meeting", "team meeting", "meeting notes", etc.

7. **Be careful with `delete-todo`.** Deletion is permanent. Confirm with the user before deleting, especially if the task list is long.

8. **Use `list-active-todos` for current work.** When the user asks about what they need to do, use `list-active-todos` (only not-done tasks) instead of `list-todos` (all tasks). This keeps the list clean.

9. **Return clear results.** After using a tool, summarize the result in plain language for the user.

---

## Tool Details and Examples

### 1. `create-todo` — Add a New Task

**When to use:** The user wants to add a new task.

**Parameters:**
- `title` (required): Short name of the task.
- `description` (required): More details. You may use markdown.

**Example:**
```
User: "Add a task to buy groceries tonight."
You: Use create-todo
  title: "Buy groceries"
  description: "Buy groceries for dinner tonight. Items: vegetables, rice, chicken."
```

---

### 2. `list-todos` — Show All Tasks

**When to use:** The user wants to see every task (done and not done).

**Parameters:** None.

**Example:**
```
User: "Show me all my tasks."
You: Use list-todos
→ Returns a formatted list of all tasks.
```

---

### 3. `get-todo` — Show One Task

**When to use:** The user wants details about one specific task. You need the task's ID.

**Parameters:**
- `id` (required): The UUID of the task.

**Example:**
```
User: "Show me the details of task abc-123."
You: Use get-todo
  id: "abc-123"
```

---

### 4. `update-todo` — Change a Task

**When to use:** The user wants to change a task's title or description.

**Parameters:**
- `id` (required): The UUID of the task to update.
- `title` (optional): New title.
- `description` (optional): New description.

**Rule:** Provide at least one of `title` or `description`.

**Example:**
```
User: "Change the title of task abc-123 to 'Buy groceries for dinner'."
You: Use update-todo
  id: "abc-123"
  title: "Buy groceries for dinner"
```

---

### 5. `complete-todo` — Mark a Task as Done

**When to use:** The user finished a task and wants to mark it complete.

**Parameters:**
- `id` (required): The UUID of the task.

**Example:**
```
User: "I finished reading the book. Mark it done."
You: Use complete-todo
  id: "abc-123"
```

---

### 6. `delete-todo` — Remove a Task

**When to use:** The user wants to permanently remove a task.

**Parameters:**
- `id` (required): The UUID of the task.

**Example:**
```
User: "Delete task abc-123."
You: First check the task exists (use get-todo), then use delete-todo
  id: "abc-123"
```

---

### 7. `search-todos-by-title` — Search by Title

**When to use:** The user wants to find tasks by a word in the title.

**Parameters:**
- `title` (required): The search word or phrase.

**Example:**
```
User: "Find tasks about 'meeting'."
You: Use search-todos-by-title
  title: "meeting"
→ Returns all tasks whose title contains "meeting" (any case).
```

---

### 8. `search-todos-by-date` — Search by Date

**When to use:** The user wants to find tasks created on a specific date.

**Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format.

**Example:**
```
User: "Show me tasks I created on 2025-01-15."
You: Use search-todos-by-date
  date: "2025-01-15"
```

---

### 9. `list-active-todos` — Show Only Not-Done Tasks

**When to use:** The user wants to see only tasks that are still pending.

**Parameters:** None.

**Example:**
```
User: "What do I still need to do?"
You: Use list-active-todos
→ Returns only tasks that are NOT completed.
```

---

### 10. `summarize-active-todos` — Summarize Not-Done Tasks

**When to use:** The user wants a quick overview of pending tasks (short, not full details).

**Parameters:** None.

**Example:**
```
User: "Give me a quick summary of my pending tasks."
You: Use summarize-active-todos
→ Returns a short summary with count and task titles.
```

---

## Practical Scenarios

Here are common situations where you would use these tools. Follow the steps for each scenario.

### Scenario 1: Planning a Day

**User:** "I have a busy day tomorrow. Help me plan."

**Steps:**
1. First, check existing tasks: use `list-active-todos` to see what is already pending.
2. Ask the user what they need to do tomorrow.
3. For each item, use `create-todo` with a clear title and description (including time or priority if mentioned).
4. After adding, use `list-active-todos` again to show the final plan.

---

### Scenario 2: Managing a Project with Multiple Tasks

**User:** "I'm working on a project. Let me add several tasks."

**Steps:**
1. Use `list-active-todos` to check for duplicates first.
2. Use `create-todo` for each task. Give each a clear title.
3. If tasks are related, mention in the description that they belong to the same project.
4. Use `list-active-todos` to confirm all tasks were added.

---

### Scenario 3: Tracking Progress Throughout the Day

**User:** "I finished one task. Let me mark it done."

**Steps:**
1. Use `list-active-todos` to find the task the user is referring to.
2. Match the task name the user mentioned with the list.
3. Use `complete-todo` with that task's ID.
4. Confirm: "Task 'X' marked as completed."

---

### Scenario 4: End-of-Day Review

**User:** "Let me review what I did today."

**Steps:**
1. Use `list-todos` to show ALL tasks (including completed ones).
2. Highlight which tasks are completed (✅) and which are still active (⏳).
3. If there are many tasks, also use `summarize-active-todos` for a quick overview of what remains.

---

### Scenario 5: Finding an Old Task by Date

**User:** "What tasks did I create last Monday?"

**Steps:**
1. Determine the date of "last Monday" in `YYYY-MM-DD` format.
2. Use `search-todos-by-date` with that date.
3. Summarize the results for the user.

---

### Scenario 6: Cleaning Up Old Tasks

**User:** "Let me clean up. Show me all tasks about 'meeting'."

**Steps:**
1. Use `search-todos-by-title` with `title: "meeting"`.
2. Show the results.
3. If the user wants to delete any, ask which one, then use `delete-todo` with confirmation.

---

### Scenario 7: Updating a Task Description

**User:** "I want to add more details to task abc-123."

**Steps:**
1. Use `get-todo` with the task ID to see the current content.
2. Update with `update-todo`, providing the new `description` (or `title`).
3. Confirm the update with the user.

---

### Scenario 8: Weekly Summary Report

**User:** "Give me a weekly summary of my tasks."

**Steps:**
1. Use `list-todos` to get all tasks.
2. Count completed vs. active tasks.
3. Use `summarize-active-todos` for the pending items.
4. Present a short report: total tasks, completed count, active count, and list of pending titles.

---

## Quick Reference Cheat Sheet

| What You Need | Use This Tool |
|---------------|---------------|
| Add a task | `create-todo` |
| See everything | `list-todos` |
| See only pending tasks | `list-active-todos` |
| See one task's details | `get-todo` |
| Change a task | `update-todo` |
| Mark done | `complete-todo` |
| Delete a task | `delete-todo` |
| Find by title word | `search-todos-by-title` |
| Find by creation date | `search-todos-by-date` |
| Quick summary of pending | `summarize-active-todos` |

---

## Tips for Working with Small Tool Sets

- **One tool at a time.** Call one tool, read its result, then decide the next step.
- **Keep IDs handy.** When a tool returns a task with an ID, remember that ID for the next call.
- **Be patient with search.** If `search-todos-by-title` returns too many or too few results, try a different search word.
- **Always confirm deletions.** Ask the user before permanently removing a task.

---

*This skill document is designed for 4B-parameter language models. It uses simple language, clear steps, and practical examples to make task management easy and reliable.*
