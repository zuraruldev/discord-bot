import { toolRegistry } from '../registry';
import { clarifyTool } from './interaction';
import { editMemoryTool, forgetMemoryTool, recallTool, rememberTool } from './memory';
import { manageTaskPlanTool } from './planner';
import { createSkillFromChatTool, scanSkillSecurityTool, useSkillTool } from './skills';
import { spawnSubagentTool } from './subagent';
import { sequentialThinkingTool } from './thinking';

export function registerAgenticTools(): void {
    toolRegistry.register(rememberTool);
    toolRegistry.register(recallTool);
    toolRegistry.register(forgetMemoryTool);
    toolRegistry.register(editMemoryTool);
    toolRegistry.register(sequentialThinkingTool);
    toolRegistry.register(spawnSubagentTool);
    toolRegistry.register(manageTaskPlanTool);
    toolRegistry.register(useSkillTool);
    toolRegistry.register(createSkillFromChatTool);
    toolRegistry.register(scanSkillSecurityTool);
    toolRegistry.register(clarifyTool);
}
