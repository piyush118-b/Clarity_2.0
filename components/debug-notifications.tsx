'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugNotifications() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    const testResults = [];

    try {
      // Test 1: Check if notifications table exists
      testResults.push({ test: 'Table existence check', status: 'running' });
      const { data: tableData, error: tableError } = await supabase
        .from('notifications')
        .select('count')
        .limit(1);
      
      if (tableError) {
        testResults[0] = { test: 'Table existence check', status: 'failed', error: tableError };
      } else {
        testResults[0] = { test: 'Table existence check', status: 'passed', data: tableData };
      }

      // Test 2: Check current user
      testResults.push({ test: 'User authentication check', status: 'running' });
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        testResults[1] = { test: 'User authentication check', status: 'failed', error: userError };
      } else {
        testResults[1] = { test: 'User authentication check', status: 'passed', data: { id: user?.id, email: user?.email } };
      }

      // Test 3: Check profiles table for admin users
      testResults.push({ test: 'Admin users check', status: 'running' });
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'admin');
      
      if (adminError) {
        testResults[2] = { test: 'Admin users check', status: 'failed', error: adminError };
      } else {
        testResults[2] = { test: 'Admin users check', status: 'passed', data: admins };
      }

      // Test 4: Try to create a test notification
      if (user && admins && admins.length > 0) {
        testResults.push({ test: 'Notification creation test', status: 'running' });
        const { data: notificationData, error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: admins[0].id,
            title: 'Test Notification',
            content: 'This is a test notification to debug the system',
            notification_type: 'info'
          })
          .select();
        
        if (notificationError) {
          testResults[3] = { test: 'Notification creation test', status: 'failed', error: notificationError };
        } else {
          testResults[3] = { test: 'Notification creation test', status: 'passed', data: notificationData };
        }
      }

      setResults([...testResults]);
    } catch (error) {
      testResults.push({ test: 'General error', status: 'failed', error });
      setResults([...testResults]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Notification System Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testDatabaseConnection} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? 'Running Tests...' : 'Run Database Tests'}
        </Button>
        
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{result.test}</span>
                <span className={`font-bold ${getStatusColor(result.status)}`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              
              {result.error && (
                <div className="bg-red-50 p-3 rounded mt-2">
                  <p className="text-red-800 font-medium">Error:</p>
                  <pre className="text-red-700 text-sm mt-1 whitespace-pre-wrap">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.data && (
                <div className="bg-green-50 p-3 rounded mt-2">
                  <p className="text-green-800 font-medium">Data:</p>
                  <pre className="text-green-700 text-sm mt-1 whitespace-pre-wrap">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}