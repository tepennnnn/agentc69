/** The editor as an MCP server over stdio. Register it once with your coding agent; see RULES.md. */
import { serveMcp } from "@agentcut/core/modules/agent/server/mcp";
import { VERSION as version } from "@agentcut/core/common/server/runtime";
serveMcp(process.stdin, process.stdout, version).then(() => process.exit(0));
