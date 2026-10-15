import { toolRegistry } from '../registry';
import { askOwnerTool, sendDmTool, setAfkTool, setReminderTool } from './communication';
import {
    fetchWebPageTool,
    fetchYoutubeTranscriptTool,
    inspectImageTool,
    manageScheduleTool,
    readFileTool,
    searchNovelCatalogTool
} from './documents';
import { moderateTool } from './moderation';
import { serverInfoTool } from './server';

export function registerDiscordTools(): void {
    toolRegistry.register(serverInfoTool);
    toolRegistry.register(moderateTool);
    toolRegistry.register(setAfkTool);
    toolRegistry.register(setReminderTool);
    toolRegistry.register(sendDmTool);
    toolRegistry.register(askOwnerTool);
    toolRegistry.register(readFileTool);
    toolRegistry.register(fetchWebPageTool);
    toolRegistry.register(inspectImageTool);
    toolRegistry.register(fetchYoutubeTranscriptTool);
    toolRegistry.register(searchNovelCatalogTool);
    toolRegistry.register(manageScheduleTool);
}
