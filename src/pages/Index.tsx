
// Index page component
import { useState } from "react";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { ManagementDashboard } from "@/components/pages/ManagementDashboard";
import { SalesDashboard } from "@/SalesDashboard/SalesDashboard";
import { WhatsNewModal } from '@/components/header/WhatsNewModal';
import { useBackgroundUpdateChecker } from '@/hooks/useBackgroundUpdateChecker';
// import { APP_VERSION } from '@/utils/version';
const APP_VERSION = "1.3.3"; // Temporary hardcoded version to fix import issue

type MainSection = "home" | "management" | "sales" | "products";

const Index = () => {
  const [activeSection, setActiveSection] = useState<MainSection>("home");

  const {
    hasUpdates,
    showWhatsNew,
    handleUpdate,
    handleRemindLater,
    handleCloseWhatsNew,
    latestVersionInfo
  } = useBackgroundUpdateChecker({
    currentVersion: APP_VERSION,
    enableNotifications: true,
    enableBackgroundChecks: true
  });

  const handleSectionChange = (section: MainSection) => {
    setActiveSection(section);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "home":
        return (
          <DashboardPage
            onNavigateToSection={handleSectionChange}
          />
        );
      case "management":
        return <ManagementDashboard onBack={() => setActiveSection("home")} />;
      case "sales":
        return <SalesDashboard onBack={() => setActiveSection("home")} />;
      default:
        return (
          <DashboardPage
            onNavigateToSection={handleSectionChange}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 relative">
      {/* Main Content Area - Mobile Optimized */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="min-h-screen pb-16">
          {renderActiveSection()}
        </div>
      </main>

      {/* What's New Modal */}
      {latestVersionInfo && (
        <WhatsNewModal
          open={showWhatsNew}
          onOpenChange={handleCloseWhatsNew}
          versionInfo={latestVersionInfo}
          currentVersion={APP_VERSION}
          onUpdate={handleUpdate}
          onRemindLater={handleRemindLater}
        />
      )}
    </div>
  );
};

export default Index;
