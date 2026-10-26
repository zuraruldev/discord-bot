export interface ToolFunctionDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export interface ToolDefinition {
    type: 'function';
    function: ToolFunctionDefinition;
}

export interface ToolExecutionContext {
    userId: string;
    authorName: string;
    channelId: string;
    isAdmin: boolean;
    isCreator: boolean;
    guildId?: string;
}

export interface BotTool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    adminOnly?: boolean;
    fintracOnly?: boolean;
    execute: (args: Record<string, unknown>, context: ToolExecutionContext) => Promise<unknown>;
}
