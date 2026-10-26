import { isFintracAuthorized } from '../fintrac/auth.ts';
import type { BotTool, ToolDefinition, ToolExecutionContext } from './types.ts';

class ToolRegistry {
    private tools = new Map<string, BotTool>();

    public register(tool: BotTool): void {
        this.tools.set(tool.name, tool);
    }

    public get(name: string): BotTool | undefined {
        return this.tools.get(name);
    }

    public getAllDefinitions(options?: { isAdmin?: boolean; userId?: string }): ToolDefinition[] {
        const definitions: ToolDefinition[] = [];
        const isAdmin = options?.isAdmin ?? false;
        const userId = options?.userId ?? '';

        for (const tool of this.tools.values()) {
            if (tool.adminOnly && !isAdmin) {
                continue;
            }
            if (tool.fintracOnly && !isFintracAuthorized(userId)) {
                continue;
            }
            definitions.push({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }
            });
        }

        return definitions;
    }

    public async execute(
        name: string,
        args: Record<string, unknown>,
        context: ToolExecutionContext
    ): Promise<unknown> {
        const tool = this.tools.get(name);
        if (!tool) {
            return {
                success: false,
                message: `Tool "${name}" tidak ditemukan di sistem.`
            };
        }

        if (tool.adminOnly && !context.isAdmin) {
            return {
                success: false,
                message: `Akses ditolak: Tool "${name}" hanya boleh dijalankan oleh Admin atau Developer bot.`
            };
        }

        if (tool.fintracOnly && !isFintracAuthorized(context.userId)) {
            return {
                success: false,
                message: `Akses ditolak: Tool "${name}" hanya boleh dijalankan oleh Admin atau trader FINTRAC yang terdaftar.`
            };
        }

        try {
            return await tool.execute(args, context);
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                message: `Error saat mengeksekusi tool "${name}": ${errorMsg}`
            };
        }
    }
}

export const toolRegistry = new ToolRegistry();
