namespace ScopeFlow.Api.Models;

public class Project
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string ClientName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal ContractValue { get; set; }

    public decimal EstimatedHours { get; set; }

    public DateTime? Deadline { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<ScopeItem> ScopeItems { get; set; } = new List<ScopeItem>();

    public ICollection<ChangeRequest> ChangeRequests { get; set; } = new List<ChangeRequest>();
}