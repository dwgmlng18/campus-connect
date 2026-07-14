import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const path = url.pathname;

  // Cek kategori rute
  const isPublisherRoute = path.startsWith("/publisher");
  const isSuperadminRoute = path.startsWith("/superadmin");
  const isAuthRoute = path === "/login" || path === "/register";

  if (isPublisherRoute || isSuperadminRoute || isAuthRoute) {
    if (!user) {
      // Jika mencoba masuk ke area terproteksi tanpa login, alihkan ke login
      if (isPublisherRoute || isSuperadminRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } else {
      // Jika sudah login, verifikasi role dan status persetujuan dari database
      const { data: publicUser } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", user.id)
        .single();

      // Jika data profil publik hilang, logout paksa
      if (!publicUser) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=no_profile", request.url));
      }

      // Jika statusnya belum disetujui (pending) atau ditolak (reject)
      if (publicUser.status !== "approve") {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(`/login?error=unauthorized_${publicUser.status}`, request.url)
        );
      }

      // Proteksi berdasarkan role masing-masing
      if (publicUser.role === "publisher") {
        if (isSuperadminRoute || isAuthRoute) {
          return NextResponse.redirect(new URL("/publisher/dashboard", request.url));
        }
      } else if (publicUser.role === "superadmin") {
        if (isPublisherRoute || isAuthRoute) {
          return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
        }
      }
    }
  }

  return supabaseResponse;
}

