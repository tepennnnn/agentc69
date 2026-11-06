/** Shared server policy for this local clone. There is deliberately no paid-service opt-in. */
export function assertServiceAllowed(provider: string): void {
  if (provider === "postgun" || provider === "postbridge") {
    throw new Error("Paid publishing services are disabled in AgentCut Local. Export your video and publish it manually.");
  }
  if (provider === "google") {
    throw new Error("Google Programmable Search is disabled in AgentCut Local. Use Wikimedia Commons, Openverse, or local images.");
  }
}
