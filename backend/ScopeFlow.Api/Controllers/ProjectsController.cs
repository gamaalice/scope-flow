using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScopeFlow.Api.Data;
using ScopeFlow.Api.Models;

namespace ScopeFlow.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly ScopeFlowDbContext _context;

    public ProjectsController(ScopeFlowDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
    {
        var projects = await _context.Projects
            .AsNoTracking()
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
        var project = await _context.Projects
            .Include(p => p.ScopeItems)
            .Include(p => p.ChangeRequests)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject(Project project)
    {
        project.Id = 0;
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProject),
            new { id = project.Id },
            project
        );
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProject(int id, Project project)
    {
        var existingProject = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id);

        if (existingProject is null)
        {
            return NotFound();
        }

        existingProject.Name = project.Name;
        existingProject.ClientName = project.ClientName;
        existingProject.Description = project.Description;
        existingProject.ContractValue = project.ContractValue;
        existingProject.EstimatedHours = project.EstimatedHours;
        existingProject.Deadline = project.Deadline;
        existingProject.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
        {
            return NotFound();
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}