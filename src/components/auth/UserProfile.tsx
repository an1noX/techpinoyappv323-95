
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <User className="h-4 w-4" />
      <span className="text-sm">{user.email}</span>
    </Button>
  );
}
