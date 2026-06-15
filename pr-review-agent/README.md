# PR Review Agent

A .NET 8 minimal API that listens for GitHub PR webhooks and posts inline review comments using Claude.

## How it works

1. GitHub sends a `pull_request` webhook on open/sync/reopen
2. Agent validates the HMAC-SHA256 signature
3. Fetches the PR diff via Octokit + GitHub REST API
4. Loads `CLAUDE.md` from the repo root (your conventions file) if present
5. Sends diff + conventions to Claude with a structured prompt
6. Parses the JSON response into typed `ReviewComment` objects
7. Posts inline comments on the diff via GitHub Reviews API

## Prerequisites

- .NET 8 SDK
- A GitHub Personal Access Token with `repo` scope
- An Anthropic API key
- A public URL for the webhook (use [ngrok](https://ngrok.com) for local dev)

## Setup

### 1. Configure secrets

Never put real secrets in `appsettings.json`. Use .NET user secrets for local dev:

```bash
dotnet user-secrets init
dotnet user-secrets set "GitHub:Token" "ghp_your_token_here"
dotnet user-secrets set "GitHub:WebhookSecret" "your_webhook_secret"
dotnet user-secrets set "Anthropic:ApiKey" "sk-ant-your_key_here"
```

For production, use environment variables or Azure Key Vault.

### 2. Register the GitHub webhook

In your repo: Settings → Webhooks → Add webhook

- **Payload URL**: `https://your-domain.com/webhook/github`
- **Content type**: `application/json`
- **Secret**: same value as `GitHub:WebhookSecret`
- **Events**: Select "Pull requests" only

### 3. Add a CLAUDE.md to your repo (optional but recommended)

This is the most impactful thing you can do. Example:

```markdown
## Code conventions

- All async methods must have cancellation token support
- No raw SQL — use EF Core or Dapper with parameterized queries
- Auth checks must happen at the controller level, never inside services
- All public APIs must have XML doc comments
- Never catch Exception — catch specific types
- Log at Warning or above for recoverable errors, Error for unrecoverable
```

The agent will load this file and enforce your standards in every review.

### 4. Run locally

```bash
dotnet run
```

For local webhook testing with ngrok:
```bash
ngrok http 5000
# Copy the https URL to your GitHub webhook config
```

### 5. Docker

```bash
docker build -t pr-review-agent .
docker run -p 8080:8080 \
  -e GitHub__Token=ghp_... \
  -e GitHub__WebhookSecret=... \
  -e Anthropic__ApiKey=sk-ant-... \
  pr-review-agent
```

## Stop conditions (by design)

The agent intentionally:
- **Never approves or requests changes** — comments only
- **Skips generated/binary files** (lockfiles, minified JS, migrations, images)
- **Filters nits on large PRs** (>500 line changes)
- **Skips CLAUDE.md itself** to avoid recursive self-review
- **Returns quickly to GitHub** (200 OK) and processes async to avoid webhook timeouts

## Extending

To add more review lenses, edit `ClaudeReviewService.BuildSystemPrompt()`.

To add file-level context (fetch the full file, not just the diff), add a call in
`WebhookController.ProcessReviewAsync()` before calling `_claude.ReviewPullRequestAsync()`.

To route different repos to different Claude models or prompts, add repo-specific
config to `appsettings.json` and branch in the controller.
