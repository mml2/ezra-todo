using System.Security.Cryptography;
using System.Text;

namespace PrReviewAgent.Services;

public class WebhookSignatureValidator
{
    private readonly string _secret;

    public WebhookSignatureValidator(IConfiguration config)
    {
        _secret = config["GitHub:WebhookSecret"]
            ?? throw new InvalidOperationException("GitHub:WebhookSecret is required");
    }

    public bool IsValid(string payload, string? signatureHeader)
    {
        if (string.IsNullOrEmpty(signatureHeader) || !signatureHeader.StartsWith("sha256="))
            return false;

        var expectedHash = signatureHeader["sha256=".Length..];
        var keyBytes = Encoding.UTF8.GetBytes(_secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(keyBytes);
        var computedHash = Convert.ToHexString(hmac.ComputeHash(payloadBytes)).ToLower();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHash),
            Encoding.UTF8.GetBytes(expectedHash));
    }
}
