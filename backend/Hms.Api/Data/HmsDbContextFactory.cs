using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Hms.Api.Data;

public sealed class HmsDbContextFactory : IDesignTimeDbContextFactory<HmsDbContext>
{
    public HmsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<HmsDbContext>()
            .UseMySQL("Server=127.0.0.1;Port=3306;Database=hms;User=root;Password=")
            .Options;
        return new HmsDbContext(options);
    }
}
