# n8n / Hermes video generation

Agent Cut can submit a video prompt to an HTTPS n8n workflow, follow it while Hermes and Google Flow generate it, and import the completed video into the current project's Assets. The editor only makes outbound HTTPS requests; the Oracle server does not need access to Agent Cut's localhost.

Configure the connection under **Settings → This machine → Google Flow video generation**, or set the matching variables in `.env.example`.

## Webhook contract

Use a long random bearer token on both n8n webhooks. Agent Cut sends it as `Authorization: Bearer …`. Treat the generation id as an idempotency key: receiving the same `requestId` twice should return the existing job instead of starting another paid generation.

### Submit

Agent Cut sends `POST` to the submit URL:

```json
{
  "requestId": "vg_…",
  "projectId": "…",
  "prompt": "A cinematic tracking shot…",
  "aspectRatio": "16:9",
  "durationSeconds": 8,
  "metadata": { "sequenceId": "s_…", "placeAt": null, "layer": 0, "autoPlace": false }
}
```

Return quickly with HTTP 2xx and JSON. Agent Cut accepts `requestId`, `remoteJobId`, `jobId`, or `id` as the identifier:

```json
{ "requestId": "vg_…", "status": "queued" }
```

### Status

Agent Cut sends `GET <status-url>?requestId=<id>`. Return `queued`, `generating`, `ready`, `failed`, or `cancelled`. Common equivalents such as `processing`, `completed`, and `error` are also understood.

```json
{ "requestId": "vg_…", "status": "generating", "progress": 0.45, "stage": "Google Flow is rendering" }
```

For a completed request, return a temporary HTTPS object URL. The URL's hostname must be in Agent Cut's allow-list. A SHA-256 digest is optional but recommended.

```json
{
  "requestId": "vg_…",
  "status": "ready",
  "output": {
    "downloadUrl": "https://objectstorage.…/p/…/o/video.mp4",
    "contentType": "video/mp4",
    "size": 18273455,
    "sha256": "0123456789abcdef…",
    "expiresAt": "2026-11-01T12:30:00Z"
  }
}
```

For failures, return a safe message that contains no provider credentials:

```json
{ "requestId": "vg_…", "status": "failed", "error": "Google Flow rejected the prompt" }
```

### Cancel (optional)

When a cancel URL is configured, Agent Cut sends `POST` with `{ "requestId": "…" }`. Without one, Cancel only stops local tracking; it cannot stop work already running in Hermes or Google Flow.

## Recommended Oracle flow

1. n8n authenticates the request and stores `requestId` plus state in a durable store.
2. n8n calls the existing Hermes MCP workflow and returns `queued` immediately.
3. Hermes generates with Google Flow and hands the result back to n8n.
4. n8n uploads the MP4 to a private OCI Object Storage bucket and records its digest.
5. The status webhook creates a short-lived pre-authenticated object URL only when ready.
6. Agent Cut downloads, validates, imports, and deletes its temporary download. The project retains its own media copy.

Do not return video bytes through an n8n webhook. Object storage is a safer handoff for generated files and avoids webhook payload and process-memory limits.
