import React, { useState } from 'react';
import { PullToRefresh } from './PullToRefresh';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Clock } from 'lucide-react';

export const PullToRefreshDemo: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setRefreshCount(prev => prev + 1);
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pull-to-Refresh Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
          </div>
          <div className="text-sm text-gray-600">
            Refresh count: {refreshCount}
          </div>
          <p className="text-sm text-gray-500">
            Pull down on this content to trigger a refresh. The gesture will work on mobile devices.
          </p>
        </CardContent>
      </Card>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sample Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This is sample content that can be refreshed by pulling down on mobile devices.
                The pull-to-refresh gesture will trigger a data refresh and show a loading indicator.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This demonstrates that the pull-to-refresh works across multiple content blocks.
                Try pulling down from the top of this area to refresh the data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Pull down from the top of the screen</p>
                <p>• Release when you see "Release to refresh"</p>
                <p>• Wait for the refresh to complete</p>
                <p>• The timestamp will update to show the refresh worked</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PullToRefresh>
    </div>
  );
}; 