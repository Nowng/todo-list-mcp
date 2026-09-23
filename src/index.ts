/**
 * index.ts
 *
 * This is the main entry point for the LM Studio Plugin.
 * It exports:
 * - main(pluginContext): The function LM Studio calls to register tools/config.
 * - toolsProvider: The tool definitions (for direct use).
 * - configSchematics, globalConfigSchematics: UI configuration schemas.
 */
import { type PluginContext } from "@lmstudio/sdk";
import { toolsProvider } from "./toolsProvider.js";
import { configSchematics, globalConfigSchematics } from "./config.js";

/**
 * Main function called by LM Studio's entry point.
 * Registers the tools provider and config schematics with the plugin context.
 */
export async function main(ctx: PluginContext): Promise<void> {
  ctx.withToolsProvider(toolsProvider);
  ctx.withConfigSchematics(configSchematics);
  ctx.withGlobalConfigSchematics(globalConfigSchematics);
}

export { toolsProvider, configSchematics, globalConfigSchematics };
