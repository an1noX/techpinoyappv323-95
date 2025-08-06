
interface OfflineIndicatorProps {
  isOffline: boolean;
}

export const OfflineIndicator = ({ isOffline }: OfflineIndicatorProps) => {
  if (!isOffline) return null;

  return (
    <div className="w-full mt-2">
      <div className="bg-orange-100 border border-orange-300 rounded-lg p-2">
        <p className="text-xs text-orange-800">
          <strong>Offline Mode:</strong> Searching in cached data only
        </p>
      </div>
    </div>
  );
};
