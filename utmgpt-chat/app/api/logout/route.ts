import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to the root page
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL));
}
