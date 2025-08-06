import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { migrateInventoryPurchaseNotes } from '@/utils/migrateInventoryNotes';

export const MigrationRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const migrationResult = await migrateInventoryPurchaseNotes();
      setResult(migrationResult);
      
      if (migrationResult.success) {
        toast.success(`Migration completed! Updated ${migrationResult.updated} records`);
      } else {
        toast.error(`Migration failed: ${migrationResult.error}`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Database Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This will update inventory purchase notes from "created from budget optimization" to "budget".
        </p>
        
        <Button 
          onClick={runMigration} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Migration...' : 'Run Migration'}
        </Button>
        
        {result && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <pre className="text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};