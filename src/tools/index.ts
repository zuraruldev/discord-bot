import { registerAgenticTools } from './agentic/index';
import { registerCodingTools } from './coding/index';
import { registerDiscordTools } from './discord/index';
import { registerFintracTools } from './fintrac.ts';
import { registerVaultTools } from './vault';

let initialized = false;

export function initAllTools(): void {
    if (initialized) return;
    registerCodingTools();
    registerDiscordTools();
    registerAgenticTools();
    registerVaultTools();
    registerFintracTools();
    initialized = true;
}

initAllTools();

export * from './registry';
export * from './types';
export * from './vault';
