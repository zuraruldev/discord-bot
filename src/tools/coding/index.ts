import { toolRegistry } from '../registry';
import { codeArchitectReviewTool, lintAndFormatCodeTool } from './analysis';
import { executeCodeTool, manageSandboxServiceTool } from './execution';
import {
    editCodeFileTool,
    listDirTool,
    readCodeFileTool,
    searchFilesTool,
    setWorkdirTool,
    writeCodeFileTool
} from './files';

export function registerCodingTools(): void {
    toolRegistry.register(readCodeFileTool);
    toolRegistry.register(editCodeFileTool);
    toolRegistry.register(writeCodeFileTool);
    toolRegistry.register(listDirTool);
    toolRegistry.register(searchFilesTool);
    toolRegistry.register(setWorkdirTool);
    toolRegistry.register(executeCodeTool);
    toolRegistry.register(manageSandboxServiceTool);
    toolRegistry.register(lintAndFormatCodeTool);
    toolRegistry.register(codeArchitectReviewTool);
}
