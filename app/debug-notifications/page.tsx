import DebugNotifications from '@/components/debug-notifications';

export default function DebugNotificationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification System Debug</h1>
      <DebugNotifications />
    </div>
  );
}