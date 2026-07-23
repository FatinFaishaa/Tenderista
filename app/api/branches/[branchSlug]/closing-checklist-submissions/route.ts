import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyDepartment } from "@/lib/staff/queries";
import {
  submitClosingChecklistPhoto,
  ClosingChecklistIncompleteError,
  ClosingChecklistAlreadySubmittedError,
} from "@/lib/closingChecklists/queries";
import { uploadClosingChecklistPhoto } from "@/lib/storage";
import { getBranchLocalDate } from "@/lib/utils/branchDate";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, matches the bucket's configured limit

export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchSlug: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { branchSlug } = await params;
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  }

  // Owner isn't scoped to a department — but this feature is staff-facing, so an
  // Owner submitting on someone's behalf isn't a supported flow yet.
  const department =
    branch.role === "owner" ? null : await getMyDepartment(branch.id, session.userId);
  if (!department) {
    return NextResponse.json(
      { error: "You must have a department assigned to submit a closing photo." },
      { status: 403 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Photo must be a JPEG, PNG, or WebP image." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Photo must be under 5MB." }, { status: 400 });
  }

  const dateStr = getBranchLocalDate(branch.timezone).toISOString().slice(0, 10);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const photoPath = await uploadClosingChecklistPhoto(
      branch.id,
      department,
      dateStr,
      buffer,
      file.type
    );

    const submission = await submitClosingChecklistPhoto(
      branch.id,
      session.userId,
      department,
      branch.timezone,
      photoPath
    );

    return NextResponse.json({ id: submission.id });
  } catch (err) {
    if (err instanceof ClosingChecklistIncompleteError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ClosingChecklistAlreadySubmittedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
