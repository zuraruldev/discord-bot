import { registerAgenticTools } from './agentic/index';
import { registerCodingTools } from './coding/index';
import { registerDiscordTools } from './discord/index';
import { registerVaultTools } from './vault';

let initialized = false;

export function initAllTools(): void {
    if (initialized) return;
    registerCodingTools();
    registerDiscordTools();
    registerAgenticTools();
    registerVaultTools();
    initialized = true;
}

initAllTools();

export * from './registry';
export * from './types';
export * from './vault';
