namespace ScopeFlow.Api.Models;

public class ChangeRequestHistory
{
    public int Id { get; set; }

    public int ChangeRequestId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public ChangeRequest ChangeRequest { get; set; } = null!;
}