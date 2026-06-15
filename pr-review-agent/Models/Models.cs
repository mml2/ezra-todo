using System.Text.Json.Serialization;

namespace PrReviewAgent.Models;

// GitHub webhook payload (pull_request event)
public record GitHubWebhookPayload(
    [property: JsonPropertyName("action")] string Action,
    [property: JsonPropertyName("number")] int Number,
    [property: JsonPropertyName("pull_request")] PullRequestPayload PullRequest,
    [property: JsonPropertyName("repository")] RepositoryPayload Repository
);

public record PullRequestPayload(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("body")] string? Body,
    [property: JsonPropertyName("head")] GitRef Head,
    [property: JsonPropertyName("base")] GitRef Base
);

public record GitRef(
    [property: JsonPropertyName("sha")] string Sha,
    [property: JsonPropertyName("ref")] string Ref
);

public record RepositoryPayload(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("owner")] OwnerPayload Owner
);

public record OwnerPayload(
    [property: JsonPropertyName("login")] string Login
);

// Structured review comment returned by Claude
public record ReviewComment(
    [property: JsonPropertyName("path")] string Path,
    [property: JsonPropertyName("line")] int Line,
    [property: JsonPropertyName("severity")] string Severity,   // blocking | suggestion | nit
    [property: JsonPropertyName("comment")] string Comment
);

// Anthropic API request/response
public record AnthropicRequest(
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("max_tokens")] int MaxTokens,
    [property: JsonPropertyName("messages")] List<AnthropicMessage> Messages,
    [property: JsonPropertyName("system")] string System
);

public record AnthropicMessage(
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("content")] string Content
);

public record AnthropicResponse(
    [property: JsonPropertyName("content")] List<AnthropicContent> Content
);

public record AnthropicContent(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("text")] string Text
);
