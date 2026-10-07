using Microsoft.EntityFrameworkCore;
using ScopeFlow.Api.Data;
using ScopeFlow.Api.Models;

namespace ScopeFlow.Api.Services;

public class ChangeRequestService
{
    private readonly ScopeFlowDbContext _context;

    public ChangeRequestService(ScopeFlowDbContext context)
    {
        _context = context;
    }

    public async Task<ChangeRequest?> AnalyzeAsync(
        int projectId,
        int changeRequestId,
        decimal estimatedHours,
        decimal estimatedCost)
    {
        var changeRequest = await _context.ChangeRequests
            .Include(c => c.Project)
            .FirstOrDefaultAsync(c =>
                c.Id == changeRequestId &&
                c.ProjectId == projectId);

        if (changeRequest is null)
        {
            return null;
        }

        var scopeItems = await _context.ScopeItems
            .Where(s =>
                s.ProjectId == projectId &&
                s.IsIncluded)
            .ToListAsync();

        var requestText =
            $"{changeRequest.Title} {changeRequest.Description}";

        var isInScope = scopeItems.Any(scopeItem =>
            requestText.Contains(
                scopeItem.Name,
                StringComparison.OrdinalIgnoreCase));

        changeRequest.Classification =
            isInScope ? "InScope" : "OutOfScope";

        changeRequest.EstimatedHours = estimatedHours;
        changeRequest.EstimatedCost = estimatedCost;
        changeRequest.Status = "Analyzed";
        changeRequest.UpdatedAt = DateTime.UtcNow;

        AddHistory(
            changeRequest,
            "Analyzed",
            $"Solicitação classificada como {changeRequest.Classification}. " +
            $"Estimativa: {estimatedHours} horas / R$ {estimatedCost:F2}.");

        await _context.SaveChangesAsync();

        return changeRequest;
    }

    public async Task<ChangeRequest?> UpdateStatusAsync(
        int projectId,
        int changeRequestId,
        string status)
    {
        var changeRequest = await _context.ChangeRequests
            .FirstOrDefaultAsync(c =>
                c.Id == changeRequestId &&
                c.ProjectId == projectId);

        if (changeRequest is null)
        {
            return null;
        }

        changeRequest.Status = status;
        changeRequest.UpdatedAt = DateTime.UtcNow;

        AddHistory(
            changeRequest,
            status,
            $"Status alterado para {status}.");

        await _context.SaveChangesAsync();

        return changeRequest;
    }

    private static void AddHistory(
        ChangeRequest changeRequest,
        string action,
        string? description)
    {
        changeRequest.History.Add(
            new ChangeRequestHistory
            {
                Action = action,
                Description = description,
                CreatedAt = DateTime.UtcNow
            });
    }
}