'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDbPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testTableExists = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
      
      setResult({
        type: 'table_test',
        success: !error,
        data,
        error: error ? {
          message: error.message,
          code: error.code
        } : null
      })
    } catch (err) {
      setResult({
        type: 'table_test',
        success: false,
        error: err
      })
    }
    setLoading(false)
  }

  const testUserAuth = async () => {
    setLoading(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      setResult({
        type: 'auth_test',
        success: !error,
        user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        } : null,
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      })
    } catch (err) {
      setResult({
        type: 'auth_test',
        success: false,
        error: err
      })
    }
    setLoading(false)
  }

  const testProfilesTable = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)
      
      setResult({
        type: 'profiles_test',
        success: !error,
        data,
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      })
    } catch (err) {
      setResult({
        type: 'profiles_test',
        success: false,
        error: err
      })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={testUserAuth} disabled={loading}>
          Test User Authentication
        </Button>
        
        <Button onClick={testProfilesTable} disabled={loading}>
          Test Profiles Table
        </Button>
        
        <Button onClick={testTableExists} disabled={loading}>
          Test User Profiles Table
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.type} - {result.success ? 'Success' : 'Error'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}