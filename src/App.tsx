import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';

export type AppPage = 'auth' | 'dashboard' | 'project';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<AppPage>('auth');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('auth');
      }
    }
  }, [user, loading]);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('project');
  };

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-200 text-lg">Initializing AI Director Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {currentPage === 'auth' && <AuthPage />}
      {currentPage === 'dashboard' && <DashboardPage onProjectSelect={handleProjectSelect} />}
      {currentPage === 'project' && selectedProjectId && (
        <ProjectPage projectId={selectedProjectId} onBack={handleBackToDashboard} />
      )}
    </main>
  );
}

export default App;
