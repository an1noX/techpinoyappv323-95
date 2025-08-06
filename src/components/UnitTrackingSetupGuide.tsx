import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Database, Settings } from 'lucide-react';

export const UnitTrackingSetupGuide = () => {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Unit Tracking System Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The unit tracking system enables granular tracking of individual units instead of bulk quantities. 
            This fixes delivery cross-contamination bugs and enables precise unit-level management.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup Required
          </h3>
          
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Step 1</Badge>
                <span className="font-medium">Update Existing Tables</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Since tables already exist, use the simplified script that avoids syntax issues.
              </p>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                src/utils/migrations/003_update_existing_unit_tables_simple.sql
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Step 2</Badge>
                <span className="font-medium">Populate Unit Data (Safe)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Run the safe population script that handles existing data and avoids conflicts.
              </p>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                src/utils/migrations/004_populate_unit_data_safe.sql
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Step 3</Badge>
                <span className="font-medium">Verify Setup</span>
              </div>
              <p className="text-sm text-muted-foreground">
                After running both scripts, the unit tracking system will be fully activated. 
                The migration scripts are safe to run multiple times and will show detailed progress logs.
              </p>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Benefits after setup:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Eliminates delivery cross-contamination (DR appearing in wrong POs)</li>
                <li>Enables unit-level serial number tracking</li>
                <li>Precise quantity reconciliation</li>
                <li>Individual unit status management</li>
                <li>Better audit trails and reporting</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};