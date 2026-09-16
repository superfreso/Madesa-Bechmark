import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/hooks/useAppData';
import { EditModeContext } from '@/hooks/useEditMode';
import { navItems, type PageId } from '@/lib/navigation';
import { Dashboard } from '@/pages/Dashboard';
import { Competitors } from '@/pages/Competitors';
import { Categories } from '@/pages/Categories';
import { Products } from '@/pages/Products';
import { Prices } from '@/pages/Prices';
import { Payments } from '@/pages/Payments';
import { Services } from '@/pages/Services';
import { Traffic } from '@/pages/Traffic';
import { History } from '@/pages/History';
import { Sources } from '@/pages/Sources';
import { Settings } from '@/pages/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pendingCompetitorId, setPendingCompetitorId] = useState<string | null>(null);
  const { periods, loading } = useAppData();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      const latestOpen = periods.find((p) => p.status === 'open');
      const latest = latestOpen || periods[periods.length - 1];
      setSelectedPeriodId(latest.id);
    }
  }, [periods, selectedPeriodId]);

  const navItem = navItems.find((n) => n.id === currentPage);
  const subtitle = selectedPeriodId
    ? periods.find((p) => p.id === selectedPeriodId)?.name
    : undefined;

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard selectedPeriodId={selectedPeriodId} onNavigateCompetitor={(id) => {
          setPendingCompetitorId(id);
          setCurrentPage('competitors');
        }} />;
      case 'competitors':
        return <Competitors selectedPeriodId={selectedPeriodId} initialCompetitorId={pendingCompetitorId} onConsumedCompetitorId={() => setPendingCompetitorId(null)} />;
      case 'categories':
        return <Categories selectedPeriodId={selectedPeriodId} />;
      case 'products':
        return <Products selectedPeriodId={selectedPeriodId} />;
      case 'prices':
        return <Prices selectedPeriodId={selectedPeriodId} />;
      case 'payments':
        return <Payments selectedPeriodId={selectedPeriodId} />;
      case 'services':
        return <Services selectedPeriodId={selectedPeriodId} />;
      case 'traffic':
        return <Traffic selectedPeriodId={selectedPeriodId} />;
      case 'history':
        return <History selectedPeriodId={selectedPeriodId} />;
      case 'sources':
        return <Sources />;
      case 'settings':
        return <Settings selectedPeriodId={selectedPeriodId} onPeriodChange={setSelectedPeriodId} />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-madesa-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Cargando Madesa Benchmark...</p>
        </div>
      </div>
    );
  }

  return (
    <EditModeContext.Provider value={editMode}>
      <div
        className={`flex min-h-screen transition-colors duration-300 ${
          editMode ? 'bg-madesa-50/40' : 'bg-gray-50'
        }`}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title={navItem?.label || 'Dashboard'}
            subtitle={subtitle}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={setSelectedPeriodId}
            editMode={editMode}
            onToggleEditMode={() => setEditMode(!editMode)}
          />
          <main className="flex-1 overflow-y-auto">{renderPage()}</main>
        </div>
      </div>
    </EditModeContext.Provider>
  );
}

export default App;
