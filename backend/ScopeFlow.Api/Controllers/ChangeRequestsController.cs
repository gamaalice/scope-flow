using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScopeFlow.Api.Data;
using ScopeFlow.Api.Models;
using ScopeFlow.Api.Services;

namespace ScopeFlow.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:int}/change-requests")]
public class ChangeRequestsController : ControllerBase
{
    private readonly ScopeFlowDbContext _context;
    private readonly ChangeRequestService _service;

    public ChangeRequestsController(
        ScopeFlowDbContext context,
        ChangeRequestService service)
    {
        _context = context;
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ChangeRequest>>> GetChangeRequests(
        int projectId)
    {
        var projectExists = await _context.Projects
            .AnyAsync(p => p.Id == projectId);

        if (!projectExists)
        {
            return NotFound();
        }

        var changeRequests = await _context.ChangeRequests
            .Where(c => c.ProjectId == projectId)
            .AsNoTracking()
            .ToListAsync();

        return Ok(changeRequests);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ChangeRequest>> GetChangeRequest(
        int projectId,
        int id)
    {
        var changeRequest = await _context.ChangeRequests
            .Include(c => c.History)
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.ProjectId == projectId);

        if (changeRequest is null)
        {
            return NotFound();
        }

        return Ok(changeRequest);
    }

    [HttpPost]
    public async Task<ActionResult<ChangeRequest>> CreateChangeRequest(
        int projectId,
        CreateChangeRequestRequest request)
    {
        var projectExists = await _context.Projects
            .AnyAsync(p => p.Id == projectId);

        if (!projectExists)
        {
            return NotFound();
        }

        var changeRequest = new ChangeRequest
        {
            Title = request.Title,
            Description = request.Description,
            ProjectId = projectId,
            Status = "Pending",
            Classification = "Pending",
            EstimatedHours = null,
            EstimatedCost = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChangeRequests.Add(changeRequest);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetChangeRequest),
            new
            {
                projectId,
                id = changeRequest.Id
            },
            changeRequest
        );
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateChangeRequest(
        int projectId,
        int id,
        ChangeRequest changeRequest)
    {
        var existingChangeRequest = await _context.ChangeRequests
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.ProjectId == projectId);

        if (existingChangeRequest is null)
        {
            return NotFound();
        }

        existingChangeRequest.Title = changeRequest.Title;
        existingChangeRequest.Description = changeRequest.Description;
        existingChangeRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteChangeRequest(
        int projectId,
        int id)
    {
        var changeRequest = await _context.ChangeRequests
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.ProjectId == projectId);

        if (changeRequest is null)
        {
            return NotFound();
        }

        _context.ChangeRequests.Remove(changeRequest);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/analyze")]
    public async Task<ActionResult<ChangeRequest>> Analyze(
        int projectId,
        int id,
        [FromBody] AnalyzeChangeRequestRequest request)
    {
        if (request.EstimatedHours < 0 || request.EstimatedCost < 0)
        {
            return BadRequest(
                "Estimated hours and cost cannot be negative.");
        }

        var changeRequest = await _service.AnalyzeAsync(
            projectId,
            id,
            request.EstimatedHours,
            request.EstimatedCost);

        if (changeRequest is null)
        {
            return NotFound();
        }

        return Ok(changeRequest);
    }

    [HttpPost("{id:int}/status")]
    public async Task<ActionResult<ChangeRequest>> UpdateStatus(
        int projectId,
        int id,
        [FromBody] UpdateStatusRequest request)
    {
        var allowedStatuses = new[]
        {
            "Pending",
            "Analyzed",
            "Approved",
            "Rejected"
        };

        if (!allowedStatuses.Contains(request.Status))
        {
            return BadRequest(
                "Invalid status.");
        }

        var changeRequest = await _service.UpdateStatusAsync(
            projectId,
            id,
            request.Status);

        if (changeRequest is null)
        {
            return NotFound();
        }

        return Ok(new
        {
            changeRequest.Id,
            changeRequest.ProjectId,
            changeRequest.Title,
            changeRequest.Description,
            changeRequest.Status,
            changeRequest.Classification,
            changeRequest.EstimatedHours,
            changeRequest.EstimatedCost,
            changeRequest.CreatedAt,
            changeRequest.UpdatedAt
        });
    }
}

public record CreateChangeRequestRequest(
    string Title,
    string Description
);

public record AnalyzeChangeRequestRequest(
    decimal EstimatedHours,
    decimal EstimatedCost
);

public record UpdateStatusRequest(
    string Status
);