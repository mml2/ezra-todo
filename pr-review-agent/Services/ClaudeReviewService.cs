using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PrReviewAgent.Models;

namespace PrReviewAgent.Services;

public class ClaudeReviewService
{
    private readonly HttpClient _http;
    private readonly ILogger<ClaudeReviewService> _logger;
    private readonly string _model;
    private const string AnthropicVersion = "2023-06-01";

    public ClaudeReviewService(IConfiguration config, HttpClient http, ILogger<ClaudeReviewService> logger)
    {
        _logger = logger;
        _http = http;
        _model = config["Anthropic:Model"] ?? "claude-sonnet-4-6";

        var apiKey = config["Anthropic:ApiKey"]
            ?? throw new InvalidOperationException("Anthropic:ApiKey is required");

        _http.BaseAddress = new Uri("https://api.anthropic.com");
        _http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _http.DefaultRequestHeaders.Add("anthropic-version", AnthropicVersion);
    }

    public async Task<(List<ReviewComment> Comments, string Summary)> ReviewPullRequestAsync(
        string prTitle,
        string? prBody,
        string diff,
        string? repoConventions = null)
    {
        _logger.LogInformation("Sending PR diff to Claude for review");

        var systemPrompt = BuildSystemPrompt(repoConventions);
        var userPrompt = BuildUserPrompt(prTitle, prBody, diff);

        var request = new AnthropicRequest(
            Model: _model,
            MaxTokens: 4096,
            System: systemPrompt,
            Messages: [new AnthropicMessage("user", userPrompt)]
        );

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _http.PostAsync("/v1/messages", content);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        var anthropicResponse = JsonSerializer.Deserialize<AnthropicResponse>(responseJson)
            ?? throw new InvalidOperationException("Empty response from Anthropic API");

        var text = anthropicResponse.Content.FirstOrDefault()?.Text
            ?? throw new InvalidOperationException("No text content in Anthropic response");

        return ParseReviewResponse(text);
    }

    private static string BuildSystemPrompt(string? repoConventions)
    {
        var conventions = string.IsNullOrEmpty(repoConventions)
            ? "No specific conventions provided — apply general best practices."
            : repoConventions;

        return $"""
            You are a senior software engineer performing a code review.
            Your job is to provide specific, actionable, and constructive feedback.

            Repo conventions and standards:
            {conventions}

            Focus on:
            - Correctness: logic errors, off-by-one errors, null reference risks
            - Security: injection risks, auth bypass, exposed secrets, input validation
            - Architecture: violations of established patterns, tight coupling, missing abstractions
            - Performance: N+1 queries, unnecessary allocations, missing async/await
            - Maintainability: unclear naming, missing error handling, inadequate tests

            Do NOT flag:
            - Stylistic preferences unless they violate stated conventions
            - Changes in files you are told to skip
            - Trivial nits unless they indicate a larger issue

            Respond ONLY with a JSON object in this exact shape:
            {{
              "summary": "A 2-3 sentence overall assessment of the PR",
              "comments": [
                {{
                  "path": "relative/file/path.cs",
                  "line": 42,
                  "severity": "blocking",
                  "comment": "Specific explanation of the issue and how to fix it"
                }}
              ]
            }}

            severity must be one of: blocking | suggestion | nit
            If there are no issues, return an empty comments array with a positive summary.
            Return ONLY the JSON — no markdown fences, no preamble.
            """;
    }

    private static string BuildUserPrompt(string title, string? body, string diff)
    {
        return $"""
            PR Title: {title}

            PR Description:
            {body ?? "(no description provided)"}

            Changed files and diffs:
            {diff}
            """;
    }

    private (List<ReviewComment> Comments, string Summary) ParseReviewResponse(string text)
    {
        try
        {
            // Strip any accidental markdown fences
            var cleaned = text.Trim();
            if (cleaned.StartsWith("```")) 
                cleaned = string.Join('\n', cleaned.Split('\n').Skip(1).SkipLast(1));

            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;

            var summary = root.GetProperty("summary").GetString() ?? "Review complete.";
            var comments = new List<ReviewComment>();

            foreach (var item in root.GetProperty("comments").EnumerateArray())
            {
                comments.Add(new ReviewComment(
                    Path: item.GetProperty("path").GetString() ?? "",
                    Line: item.GetProperty("line").GetInt32(),
                    Severity: item.GetProperty("severity").GetString() ?? "suggestion",
                    Comment: item.GetProperty("comment").GetString() ?? ""
                ));
            }

            _logger.LogInformation("Parsed {Count} review comments from Claude", comments.Count);
            return (comments, summary);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse Claude response as JSON. Raw: {Text}", text);
            return ([], "Review could not be parsed — check agent logs.");
        }
    }
}
