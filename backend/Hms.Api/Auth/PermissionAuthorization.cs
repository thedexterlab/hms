using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Hms.Api.Auth;

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.Claims.Any(c => c.Type == "permission" && c.Value == requirement.Permission)) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

public sealed class PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : DefaultAuthorizationPolicyProvider(options)
{
    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        const string prefix = "Permission:";
        if (!policyName.StartsWith(prefix, StringComparison.Ordinal)) return await base.GetPolicyAsync(policyName);
        return new AuthorizationPolicyBuilder().RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(policyName[prefix.Length..])).Build();
    }
}
