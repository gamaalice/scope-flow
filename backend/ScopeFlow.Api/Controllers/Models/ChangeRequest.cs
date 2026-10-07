namespace ScopeFlow.Api.Models;

public class ChangeRequest
{
    public int Id { get; set; }

    public int ProjectId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending";

    public string Classification { get; set; } = "Pending";

    public decimal? EstimatedHours { get; set; }

    public decimal? EstimatedCost { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Project Project { get; set; } = null!;

    public ICollection<ChangeRequestHistory> History { get; set; } =
        new List<ChangeRequestHistory>();
}