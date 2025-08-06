import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { Session, User } from '@supabase/supabase-js';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (user) {
    // Get user role first
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role;

    // Only check onboarding for tenants
    if (role === 'tenant') {
      // Check if tenant has completed onboarding
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      // If tenant hasn't completed onboarding and is trying to access dashboard pages, redirect to onboarding
      if (!userProfile?.onboarding_completed && 
          !request.nextUrl.pathname.startsWith('/onboarding') &&
          request.nextUrl.pathname !== '/' &&
          !request.nextUrl.pathname.startsWith('/auth') &&
          request.nextUrl.pathname.startsWith('/tenant')) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }

      // If tenant has completed onboarding and is on onboarding page, redirect to tenant dashboard
      if (userProfile?.onboarding_completed && request.nextUrl.pathname.startsWith('/onboarding')) {
        const url = request.nextUrl.clone();
        url.pathname = '/tenant/dashboard';
        return NextResponse.redirect(url);
      }
    } else {
      // For admin and service_provider, redirect away from onboarding if they somehow get there
      if (request.nextUrl.pathname.startsWith('/onboarding')) {
        const url = request.nextUrl.clone();
        if (role === 'admin') url.pathname = '/admin/dashboard';
        else if (role === 'service_provider') url.pathname = '/service-provider/dashboard';
        else url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Role-based access control - prevent users from accessing wrong dashboards
    if (role) {
      const currentPath = request.nextUrl.pathname;
      
      // Check if user is trying to access a dashboard they don't have permission for
      if (role === 'admin' && (currentPath.startsWith('/tenant/') || currentPath.startsWith('/service-provider/'))) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
      
      if (role === 'tenant' && (currentPath.startsWith('/admin/') || currentPath.startsWith('/service-provider/'))) {
        const url = request.nextUrl.clone();
        url.pathname = '/tenant/dashboard';
        return NextResponse.redirect(url);
      }
      
      if (role === 'service_provider' && (currentPath.startsWith('/admin/') || currentPath.startsWith('/tenant/'))) {
        const url = request.nextUrl.clone();
        url.pathname = '/service-provider/dashboard';
        return NextResponse.redirect(url);
      }
    }
  } else if (
    request.nextUrl.pathname !== "/" &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/onboarding")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
