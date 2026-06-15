using Octokit;

namespace PrReviewAgent.Services;

public class GitHubService
{
    private readonly GitHubClient _client;
    private readonly ILogger<GitHubService> _logger;

    public GitHubService(IConfiguration config, ILogger<GitHubService> logger)
    {
        _logger = logger;
        var token = config["GitHub:Token"]
            ?? throw new InvalidOperationException("GitHub:Token is required");

        _client = new GitHubClient(new ProductHeaderValue("pr-review-agent"))
        {
            Credentials = new Credentials(token)
        };
    }

    public async Task<string> GetPullRequestDiffAsync(string owner, string repo, int prNumber)
    {
        _logger.LogInformation("Fetching diff for {Owner}/{Repo}#{PrNumber}", owner, repo, prNumber);

        var files = await _client.PullRequest.Files(owner, repo, prNumber);

        var sb = new System.Text.StringBuilder();
        foreach (var file in files)
        {
            // Skip generated/binary files
            if (ShouldSkipFile(file.FileName))
            {
                _logger.LogDebug("Skipping file: {FileName}", file.FileName);
                continue;
            }

            sb.AppendLine($"### {file.FileName} ({file.Status})");
            sb.AppendLine($"Additions: {file.Additions}, Deletions: {file.Deletions}");
            if (!string.IsNullOrEmpty(file.Patch))
            {
                sb.AppendLine("```diff");
                sb.AppendLine(file.Patch);
                sb.AppendLine("```");
            }
            sb.AppendLine();
        }

        return sb.ToString();
    }

    public async Task<IReadOnlyList<PullRequestFile>> GetPullRequestFilesAsync(
        string owner, string repo, int prNumber)
    {
        return await _client.PullRequest.Files(owner, repo, prNumber);
    }

    public async Task<string?> GetFileContentAsync(string owner, string repo, string path, string? sha = null)
    {
        try
        {
            var contents = sha != null
                ? await _client.Repository.Content.GetAllContentsByRef(owner, repo, path, sha)
                : await _client.Repository.Content.GetAllContents(owner, repo, path);

            return contents.FirstOrDefault()?.Content;
        }
        catch (NotFoundException)
        {
            return null;
        }
    }

    public async Task PostReviewAsync(
        string owner, string repo, int prNumber,
        string headSha, List<Models.ReviewComment> comments,
        string summaryBody)
    {
        _logger.LogInformation("Posting {Count} review comments on PR #{PrNumber}", comments.Count, prNumber);

        var reviewComments = new List<DraftPullRequestReviewComment>();

        // Get file line->position mapping for each changed file
        var files = await _client.PullRequest.Files(owner, repo, prNumber);
        var positionMap = BuildPositionMap(files);

        foreach (var comment in comments)
        {
            if (!positionMap.TryGetValue(comment.Path, out var lineMap))
                continue;
            if (!lineMap.TryGetValue(comment.Line, out var position))
                continue;

            var body = FormatComment(comment);
            reviewComments.Add(new DraftPullRequestReviewComment(body, headSha, comment.Path, position));
        }

        var review = new PullRequestReviewCreate
        {
            CommitId = headSha,
            Body = summaryBody,
            Event = PullRequestReviewEvent.Comment,
            Comments = reviewComments
        };

        await _client.PullRequest.Review.Create(owner, repo, prNumber, review);
    }

    // Maps file path -> (line number -> diff position)
    // GitHub requires diff position, not line number, for inline comments
    private static Dictionary<string, Dictionary<int, int>> BuildPositionMap(
        IReadOnlyList<PullRequestFile> files)
    {
        var result = new Dictionary<string, Dictionary<int, int>>();

        foreach (var file in files)
        {
            if (string.IsNullOrEmpty(file.Patch)) continue;

            var lineMap = new Dictionary<int, int>();
            int position = 0;
            int currentLine = 0;

            foreach (var line in file.Patch.Split('\n'))
            {
                position++;
                if (line.StartsWith("@@"))
                {
                    // Parse hunk header: @@ -old,count +new,start @@
                    var match = System.Text.RegularExpressions.Regex.Match(line, @"\+(\d+)");
                    if (match.Success)
                        currentLine = int.Parse(match.Groups[1].Value) - 1;
                }
                else if (line.StartsWith("+"))
                {
                    currentLine++;
                    lineMap[currentLine] = position;
                }
                else if (!line.StartsWith("-"))
                {
                    currentLine++;
                    lineMap[currentLine] = position;
                }
            }

            result[file.FileName] = lineMap;
        }

        return result;
    }

    private static string FormatComment(Models.ReviewComment c)
    {
        var icon = c.Severity switch
        {
            "blocking" => "🚫 **Blocking**",
            "suggestion" => "💡 **Suggestion**",
            "nit" => "🔹 **Nit**",
            _ => "💬 **Comment**"
        };
        return $"{icon}\n\n{c.Comment}";
    }

    private static bool ShouldSkipFile(string fileName)
    {
        var skipPatterns = new[]
        {
            ".lock", ".min.js", ".min.css", ".generated.",
            "package-lock.json", "yarn.lock", ".svg", ".png",
            ".jpg", ".gif", ".pdf", "migrations/"
        };
        return skipPatterns.Any(p => fileName.Contains(p, StringComparison.OrdinalIgnoreCase));
    }
}
