using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class PharmacyEndpoints
{
    public static IEndpointRouteBuilder MapPharmacyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pharmacy").RequireAuthorization();
        group.MapGet("/prescriptions", GetPendingPrescriptions).RequireAuthorization(Permissions.Policy(Permissions.PharmacyView));
        group.MapGet("/history", GetHistory).RequireAuthorization(Permissions.Policy(Permissions.PharmacyView));
        group.MapPost("/{consultationId:long}/dispense", Dispense).RequireAuthorization(Permissions.Policy(Permissions.PharmacyDispense));
        group.MapGet("/inventory", GetInventory).RequireAuthorization(Permissions.Policy(Permissions.PharmacyView));
        group.MapPost("/inventory", CreateItem).RequireAuthorization(Permissions.Policy(Permissions.PharmacyManage));
        group.MapPatch("/inventory/{id:long}", UpdateItem).RequireAuthorization(Permissions.Policy(Permissions.PharmacyManage));
        return app;
    }

    private static async Task<IResult> GetPendingPrescriptions(HmsDbContext db)
    {
        var consultations = await db.Consultations.AsNoTracking()
            .Include(x => x.Patient).Include(x => x.Doctor).Include(x => x.PrescriptionItems)
            .Where(x => x.PrescriptionItems.Any(i => i.Status == "Pending"))
            .OrderByDescending(x => x.CreatedAt).Take(200).ToListAsync();
        return Results.Ok(consultations.Select(ToDispenseResponse));
    }

    private static async Task<IResult> GetHistory(HmsDbContext db)
    {
        var consultations = await db.Consultations.AsNoTracking()
            .Include(x => x.Patient).Include(x => x.Doctor).Include(x => x.PrescriptionItems)
            .Where(x => x.PrescriptionItems.Count > 0 && x.PrescriptionItems.All(i => i.Status == "Dispensed"))
            .Take(200).ToListAsync();
        // Ordered client-side: the dispensing timestamp lives on the item
        // collection and ordering over it is not reliably translatable.
        var records = consultations
            .OrderByDescending(x => x.PrescriptionItems.Select(i => i.DispensedAt).Max())
            .ToList();
        return Results.Ok(records.Select(ToDispenseResponse));
    }
    // __PART2__
    private static async Task<IResult> Dispense(long consultationId, DispenseRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var consultation = await db.Consultations
            .Include(x => x.Patient).Include(x => x.Doctor).Include(x => x.PrescriptionItems)
            .SingleOrDefaultAsync(x => x.Id == consultationId);
        if (consultation is null) return Results.NotFound();
        var pending = consultation.PrescriptionItems.Where(i => i.Status == "Pending").ToList();
        if (pending.Count == 0) return Results.Conflict(new { code = "ALREADY_DISPENSED", message = "This prescription has already been dispensed." });

        var now = DateTimeOffset.UtcNow;
        var dispensedBy = http.User.FindFirst("name")?.Value ?? "Pharmacist";
        var inventory = await db.PharmacyItems.ToListAsync();
        foreach (var item in pending)
        {
            item.Status = "Dispensed";
            item.DispensedAt = now;
            item.DispensedBy = dispensedBy;
            item.PharmacyNote = request.Note?.Trim();
            var match = inventory.SingleOrDefault(i => string.Equals(i.Name, item.Medicine, StringComparison.OrdinalIgnoreCase) && i.IsActive);
            if (match is null) continue;
            if (match.StockQuantity > 0) match.StockQuantity--;
            match.UpdatedAt = now;
            RaiseLowStock(db, match, now);
        }
        audit.Add(http.User, "Pharmacy.Dispensed", "Consultation", consultation.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { consultationId, items = pending.Count, note = request.Note }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Ok(ToDispenseResponse(consultation));
    }

    private static async Task<IResult> GetInventory(HmsDbContext db)
    {
        var items = await db.PharmacyItems.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync();
        return Results.Ok(items.Select(ToInventoryResponse));
    }

    private static async Task<IResult> CreateItem(CreatePharmacyItemRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var name = request.Name.Trim();
        if (await db.PharmacyItems.AnyAsync(x => x.Name == name))
            return Results.Conflict(new { code = "DUPLICATE_ITEM", message = "An inventory item with this name already exists." });
        var now = DateTimeOffset.UtcNow;
        var item = new PharmacyItem { Name = name, Unit = request.Unit.Trim(), UnitPrice = request.UnitPrice, StockQuantity = request.StockQuantity, ReorderLevel = request.ReorderLevel, UpdatedAt = now };
        db.PharmacyItems.Add(item);
        await db.SaveChangesAsync();
        RaiseLowStock(db, item, now);
        audit.Add(http.User, "Pharmacy.ItemCreated", "PharmacyItem", item.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { item.Name, item.StockQuantity, item.ReorderLevel }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created($"/api/pharmacy/inventory/{item.Id}", ToInventoryResponse(item));
    }

    private static async Task<IResult> UpdateItem(long id, UpdatePharmacyItemRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var item = await db.PharmacyItems.SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return Results.NotFound();
        var now = DateTimeOffset.UtcNow;
        item.StockQuantity = request.StockQuantity;
        if (request.ReorderLevel is { } reorder) item.ReorderLevel = reorder;
        item.UpdatedAt = now;
        RaiseLowStock(db, item, now);
        audit.Add(http.User, "Pharmacy.ItemUpdated", "PharmacyItem", item.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { item.StockQuantity, item.ReorderLevel }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Ok(ToInventoryResponse(item));
    }

    private static void RaiseLowStock(HmsDbContext db, PharmacyItem item, DateTimeOffset now)
    {
        if (item.StockQuantity > item.ReorderLevel) return;
        db.Notifications.Add(new Notification
        {
            Title = "Low stock alert",
            Detail = $"{item.Name} is at {item.StockQuantity} {item.Unit} (reorder level {item.ReorderLevel}).",
            Severity = item.StockQuantity == 0 ? "critical" : "warning", Audience = "Pharmacy", CreatedAt = now
        });
    }

    private static DispenseResponse ToDispenseResponse(Consultation x) => new(
        x.Id, x.PatientId, $"{x.Patient.FirstName} {x.Patient.LastName}".Trim(), x.Patient.Mrn,
        x.Doctor?.FullName ?? x.DoctorUserId.ToString(), x.CreatedAt, x.Status,
        x.PrescriptionItems.FirstOrDefault(i => i.Status == "Dispensed")?.PharmacyNote,
        x.PrescriptionItems.Where(i => i.DispensedAt is not null).Select(i => i.DispensedAt!.Value).Cast<DateTimeOffset?>().DefaultIfEmpty(null).Max(),
        x.PrescriptionItems.FirstOrDefault(i => i.DispensedBy is not null)?.DispensedBy,
        x.PrescriptionItems.OrderBy(i => i.Id).Select(i => new PrescriptionItemResponse(i.Id, i.Medicine, i.Dosage, i.Duration, i.Instructions, i.Status, i.DispensedAt, i.DispensedBy, i.PharmacyNote)).ToList());

    private static PharmacyInventoryResponse ToInventoryResponse(PharmacyItem x) => new(x.Id, x.Name, x.Unit, x.UnitPrice,
        x.StockQuantity, x.ReorderLevel, StockLevel(x), x.UpdatedAt);

    private static string StockLevel(PharmacyItem x) =>
        x.StockQuantity == 0 ? "Critical" : x.StockQuantity <= x.ReorderLevel ? "Low" : "Good";
}