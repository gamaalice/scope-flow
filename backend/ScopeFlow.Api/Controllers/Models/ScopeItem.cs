namespace ScopeFlow.Api.Models;

public class ScopeItem
{
    public int Id { get; set; }

    public int ProjectId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsIncluded { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public Project Project { get; set; } = null!;
}