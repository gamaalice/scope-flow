using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScopeFlow.Api.Data;
using ScopeFlow.Api.Models;

namespace ScopeFlow.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:int}/scope-items")]
public class ScopeItemsController : ControllerBase
{
    private readonly ScopeFlowDbContext _context;

    public ScopeItemsController(ScopeFlowDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScopeItem>>> GetScopeItems(int projectId)
    {
        var projectExists = await _context.Projects
            .AnyAsync(p => p.Id == projectId);

        if (!projectExists)
        {
            return NotFound();
        }

        var scopeItems = await _context.ScopeItems
            .Where(s => s.ProjectId == projectId)
            .AsNoTracking()
            .ToListAsync();

        return Ok(scopeItems);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ScopeItem>> GetScopeItem(
        int projectId,
        int id)
    {
        var scopeItem = await _context.ScopeItems
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.Id == id &&
                s.ProjectId == projectId);

        if (scopeItem is null)
        {
            return NotFound();
        }

        return Ok(scopeItem);
    }

    [HttpPost]
    public async Task<ActionResult<ScopeItem>> CreateScopeItem(
        int projectId,
        CreateScopeItemRequest request)
    {
        var projectExists = await _context.Projects
            .AnyAsync(p => p.Id == projectId);

        if (!projectExists)
        {
            return NotFound();
        }

        var scopeItem = new ScopeItem
        {
            Name = request.Name,
            Description = request.Description,
            IsIncluded = request.IsIncluded,
            ProjectId = projectId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ScopeItems.Add(scopeItem);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetScopeItem),
            new
            {
                projectId,
                id = scopeItem.Id
            },
            scopeItem
        );
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateScopeItem(
        int projectId,
        int id,
        ScopeItem scopeItem)
    {
        var existingScopeItem = await _context.ScopeItems
            .FirstOrDefaultAsync(s =>
                s.Id == id &&
                s.ProjectId == projectId);

        if (existingScopeItem is null)
        {
            return NotFound();
        }

        existingScopeItem.Name = scopeItem.Name;
        existingScopeItem.Description = scopeItem.Description;
        existingScopeItem.IsIncluded = scopeItem.IsIncluded;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteScopeItem(
        int projectId,
        int id)
    {
        var scopeItem = await _context.ScopeItems
            .FirstOrDefaultAsync(s =>
                s.Id == id &&
                s.ProjectId == projectId);

        if (scopeItem is null)
        {
            return NotFound();
        }

        _context.ScopeItems.Remove(scopeItem);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public record CreateScopeItemRequest(
    string Name,
    string? Description,
    bool IsIncluded
);