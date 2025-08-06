import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
      token_hash,
    })

    if (!error) {
      // Get user role to determine appropriate redirect
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const role = profile?.role
        
        // Redirect based on role
        let redirectPath = next
        if (role === 'admin') {
          redirectPath = '/admin/dashboard'
        } else if (role === 'tenant') {
          // Check if tenant has completed onboarding
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .single()
          
          redirectPath = userProfile?.onboarding_completed ? '/tenant/dashboard' : '/onboarding'
        } else if (role === 'service_provider') {
          redirectPath = '/service-provider/dashboard'
        }
        
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL("/auth/error", request.url))
}
