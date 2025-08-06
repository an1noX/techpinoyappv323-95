import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { migrationService } from '@/services/migrationService';

export const UnitTrackingMigrationRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState(0);

  const migrations = [
    {
      name: 'Create Unit Tracking Tables',
      description: 'Creates purchase_order_item_units, delivery_item_units, and unit_delivery_links tables',
      sql: `
        -- Create table for tracking individual purchase order item units
        CREATE TABLE IF NOT EXISTS purchase_order_item_units (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
          unit_number INTEGER NOT NULL,
          serial_number VARCHAR(255),
          batch_number VARCHAR(255),
          unit_status VARCHAR(50) NOT NULL DEFAULT 'ordered',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(purchase_order_item_id, unit_number)
        );

        -- Create table for tracking individual delivery item units
        CREATE TABLE IF NOT EXISTS delivery_item_units (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          delivery_item_id UUID NOT NULL REFERENCES delivery_items(id) ON DELETE CASCADE,
          unit_number INTEGER NOT NULL,
          serial_number VARCHAR(255),
          batch_number VARCHAR(255),
          unit_status VARCHAR(50) NOT NULL DEFAULT 'delivered',
          condition_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(delivery_item_id, unit_number)
        );

        -- Create enhanced linking table for unit-to-unit relationships
        CREATE TABLE IF NOT EXISTS unit_delivery_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          purchase_order_unit_id UUID NOT NULL REFERENCES purchase_order_item_units(id) ON DELETE CASCADE,
          delivery_unit_id UUID NOT NULL REFERENCES delivery_item_units(id) ON DELETE CASCADE,
          link_status VARCHAR(50) NOT NULL DEFAULT 'linked',
          linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          confirmed_at TIMESTAMP WITH TIME ZONE,
          confirmed_by VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(purchase_order_unit_id),
          UNIQUE(delivery_unit_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_po_item_units_po_item_id ON purchase_order_item_units(purchase_order_item_id);
        CREATE INDEX IF NOT EXISTS idx_po_item_units_status ON purchase_order_item_units(unit_status);
        CREATE INDEX IF NOT EXISTS idx_delivery_item_units_delivery_item_id ON delivery_item_units(delivery_item_id);
        CREATE INDEX IF NOT EXISTS idx_delivery_item_units_status ON delivery_item_units(unit_status);
        CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_po_unit_id ON unit_delivery_links(purchase_order_unit_id);
        CREATE INDEX IF NOT EXISTS idx_unit_delivery_links_delivery_unit_id ON unit_delivery_links(delivery_unit_id);
      `
    },
    {
      name: 'Populate Existing Data',
      description: 'Creates units for all existing purchase order items and delivery items',
      sql: `
        -- Populate purchase_order_item_units for existing items
        DO $$
        DECLARE
          po_item RECORD;
          i INTEGER;
        BEGIN
          FOR po_item IN SELECT id, quantity FROM purchase_order_items LOOP
            FOR i IN 1..po_item.quantity LOOP
              INSERT INTO purchase_order_item_units (
                purchase_order_item_id, unit_number, unit_status
              ) VALUES (po_item.id, i, 'ordered')
              ON CONFLICT (purchase_order_item_id, unit_number) DO NOTHING;
            END LOOP;
          END LOOP;
        END $$;

        -- Populate delivery_item_units for existing items
        DO $$
        DECLARE
          delivery_item RECORD;
          i INTEGER;
        BEGIN
          FOR delivery_item IN SELECT id, quantity_delivered FROM delivery_items LOOP
            FOR i IN 1..delivery_item.quantity_delivered LOOP
              INSERT INTO delivery_item_units (
                delivery_item_id, unit_number, unit_status
              ) VALUES (delivery_item.id, i, 'delivered')
              ON CONFLICT (delivery_item_id, unit_number) DO NOTHING;
            END LOOP;
          END LOOP;
        END $$;
      `
    }
  ];

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    setStep(0);
    
    try {
      const results = [];
      
      for (let i = 0; i < migrations.length; i++) {
        setStep(i + 1);
        const migration = migrations[i];
        
        console.log(`Running migration: ${migration.name}`);
        
        try {
          // Check and run the migration
          const result = await migrationService.runUnitTrackingMigration();
          
          if (!result.success) {
            throw new Error(result.message);
          }
          
          console.log(`Migration ${migration.name} completed successfully`);
          results.push({
            name: migration.name,
            success: true
          });
        } catch (error) {
          console.error(`Migration ${migration.name} failed:`, error);
          results.push({
            name: migration.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          break;
        }
      }
      
      setResult({
        success: results.every(r => r.success),
        migrations: results,
        completed: results.length
      });
      
      if (results.every(r => r.success)) {
        toast.success(`All ${results.length} migrations completed successfully!`);
      } else {
        toast.error('Some migrations failed. Check the results below.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        migrations: []
      });
      toast.error('Migration failed');
    } finally {
      setIsRunning(false);
      setStep(0);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Unit Tracking System Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This migration will create new tables for granular unit-level tracking of purchase orders and deliveries.
            It will create individual unit records for all existing items and enable precise traceability.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h4 className="font-medium">Migration Steps:</h4>
          {migrations.map((migration, index) => (
            <div 
              key={index}
              className={`p-3 rounded-md border ${
                step > index ? 'bg-green-50 border-green-200' :
                step === index + 1 ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="font-medium">{index + 1}. {migration.name}</div>
              <div className="text-sm text-gray-600">{migration.description}</div>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={runMigration} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Migration Step {step}...
            </>
          ) : (
            'Run Unit Tracking Migration'
          )}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="font-medium mb-2">
              Migration Result: {result.success ? '✅ Success' : '❌ Failed'}
            </div>
            <div className="space-y-2">
              {result.migrations?.map((migration: any, index: number) => (
                <div key={index} className="text-sm">
                  <span className={migration.success ? 'text-green-600' : 'text-red-600'}>
                    {migration.success ? '✅' : '❌'} {migration.name}
                  </span>
                  {migration.error && (
                    <div className="text-red-600 text-xs ml-6">{migration.error}</div>
                  )}
                </div>
              ))}
            </div>
            {result.error && (
              <div className="text-red-600 text-sm mt-2">{result.error}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};