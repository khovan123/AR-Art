import type { User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";

export async function getRequestUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) return null;

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) return null;
  return user;
}
