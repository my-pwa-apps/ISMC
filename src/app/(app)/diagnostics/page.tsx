"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantDiagnostics } from "@/features/diagnostics/hooks";

export default function DiagnosticsPage() {
  const { data, isLoading, error } = useTenantDiagnostics();

  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load diagnostics: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Tenant Diagnostics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm whether the app is still read-only or ready for policy creation and rollback operations.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Write Mode</CardTitle>
                <CardDescription>Server-side feature gate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={data.writeOperationsEnabled ? "primary" : "default"}>
                  {data.writeOperationsEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Set <span className="font-medium">ENABLE_WRITE_OPERATIONS=true</span> to allow create and restore actions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delegated Write Scope</CardTitle>
                <CardDescription>Microsoft Graph permission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.graphPermissions
                  .filter((permission) => permission.scope === "DeviceManagementConfiguration.ReadWrite.All")
                  .map((permission) => (
                    <Badge key={permission.scope} variant={permission.granted ? "primary" : "default"}>
                      {permission.granted ? "Granted" : "Missing"}
                    </Badge>
                  ))}
                <p className="text-sm text-muted-foreground">
                  Required for policy copy creation and snapshot restore as a new policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environment</CardTitle>
                <CardDescription>Current runtime context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Tenant: {data.tenantId}</p>
                <p>User: {data.currentUser.displayName}</p>
                <p>Environment: {data.environment}</p>
                <p>Checked: {new Date(data.checkedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Granted Permissions</CardTitle>
              <CardDescription>Read scopes are enough for snapshots. Write scope plus the server flag unlock policy creation and restore.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {data.graphPermissions.map((permission) => (
                  <div key={permission.scope} className="rounded-lg border border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{permission.scope}</p>
                      <Badge variant={permission.granted ? "primary" : "default"}>
                        {permission.granted ? "Granted" : "Missing"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{permission.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}