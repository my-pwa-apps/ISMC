import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { getServerSession } from "@/lib/auth/serverSession";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { canMutateLocalServerFlags, setLocalEnvFlag, WRITE_OPERATIONS_ENV_KEY } from "@/lib/runtime/localEnv";
import { WriteModeUpdateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canMutateLocalServerFlags()) {
    return NextResponse.json(
      { error: "Write mode can only be changed from local development." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { enabled } = WriteModeUpdateSchema.parse(body);

    await setLocalEnvFlag(WRITE_OPERATIONS_ENV_KEY, enabled);

    return NextResponse.json({ data: { enabled } });
  } catch (err) {
    logger.error({ err }, "POST /api/diagnostics/write-mode failed");
    return toRouteErrorResponse(err, "Failed to update write mode");
  }
}