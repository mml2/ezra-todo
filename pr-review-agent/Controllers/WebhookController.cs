using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PrReviewAgent.Models;
using PrReviewAgent.Services;

namespace PrReviewAgent.Controllers;

[ApiController]
[Route("webhook")]
public class WebhookController : ControllerBase
{
    private readonly GitHubService _github;
    private readonly ClaudeReviewService _claude;
    private readonly WebhookSignatureValidator _validator;
    private readonly IConfiguration _config;
    private readonly ILogger<WebhookController> _logger;

    // Only review PRs with these actions
    private static readonly HashSet<string> ReviewableActions =
        ["opened", "synchronize", "reopened"];

    public WebhookController(
        GitHubService github,
        ClaudeReviewService claude,
        WebhookSignatureValidator validator,
        IConfiguration config,
        ILogger<WebhookController> logger)
    {
        _github = github;
        _claude = claude;
        _validator = validator;
        _config = config;
        _logger = logger;
    }

    [HttpPost("github")]
    public async Task<IActionResult> HandleGitHubWebhook()
    {
        // Read raw body for signature validation
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();

        // Validate webhook signature
        var signature = Request.Headers["X-Hub-Signature-256"].FirstOrDefault();
        if (!_validator.IsValid(payload, signature))
        {
            _logger.LogWarning("Invalid webhook signature — rejecting request");
            return Unauthorized("Invalid signature");
        }

        var eventType = Request.Headers["X-GitHub-Event"].FirstOrDefault();
        if (eventType != "pull_request")
        {
            _logger.LogDebug("Ignoring non-PR event: {EventType}", eventType);
            return Ok("Ignored");
        }

        GitHubWebhookPayload? webhookPayload;
        try
        {
            webhookPayload = JsonSerializer.Deserialize<GitHubWebhookPayload>(payload);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize webhook payload");
            return BadRequest("Invalid payload");
        }

        if (webhookPayload is null || !ReviewableActions.Contains(webhookPayload.Action))
        {
            _logger.LogDebug("Ignoring PR action: {Action}", webhookPayload?.Action);
            return Ok("Ignored");
        }

        // Fire and forget — webhook must return 200 quickly or GitHub retries
        _ = Task.Run(() => ProcessReviewAsync(webhookPayload));

        return Ok("Review queued");
    }

    private async Task ProcessReviewAsync(GitHubWebhookPayload payload)
    {
        var owner = payload.Repository.Owner.Login;
        var repo = payload.Repository.Name;
        var prNumber = payload.Number;
        var headSha = payload.PullRequest.Head.Sha;

        _logger.LogInformation("Starting review for {Owner}/{Repo}#{PrNumber}", owner, repo, prNumber);

        try
        {
            // Fetch the diff
            var diff = await _github.GetPullRequestDiffAsync(owner, repo, prNumber);

            if (string.IsNullOrWhiteSpace(diff))
            {
                _logger.LogInformation("No reviewable diff for PR #{PrNumber}", prNumber);
                return;
            }

            // Load repo conventions from CLAUDE.md if it exists
            var conventions = await _github.GetFileContentAsync(owner, repo, "CLAUDE.md", headSha);

            // Ask Claude to review
            var (comments, summary) = await _claude.ReviewPullRequestAsync(
                payload.PullRequest.Title,
                payload.PullRequest.Body,
                diff,
                conventions);

            // Apply severity filter — skip nits on large PRs
            var files = await _github.GetPullRequestFilesAsync(owner, repo, prNumber);
            var totalChanges = files.Sum(f => f.Additions + f.Deletions);
            if (totalChanges > 500)
            {
                _logger.LogInformation("Large PR ({Changes} changes) — filtering out nits", totalChanges);
                comments = comments.Where(c => c.Severity != "nit").ToList();
            }

            if (comments.Count == 0 && !string.IsNullOrEmpty(summary))
            {
                _logger.LogInformation("No comments to post for PR #{PrNumber}", prNumber);
                // Optionally still post the summary as a general comment
                return;
            }

            await _github.PostReviewAsync(owner, repo, prNumber, headSha, comments, summary);

            _logger.LogInformation(
                "Posted {Count} comments on PR #{PrNumber}: {Summary}",
                comments.Count, prNumber, summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Review failed for {Owner}/{Repo}#{PrNumber}", owner, repo, prNumber);
        }
    }
}
