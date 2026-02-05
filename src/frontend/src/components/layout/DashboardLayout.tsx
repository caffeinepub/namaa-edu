import { useState } from 'react';
import SideNav from './SideNav';
import Header from './Header';
import ProgramsPage from '../../pages/programs/ProgramsPage';
import ActivitiesPage from '../../pages/activities/ActivitiesPage';
import OrganizationsPage from '../../pages/organizations/OrganizationsPage';
import PeoplePage from '../../pages/people/PeoplePage';
import DocumentationPage from '../../pages/documentation/DocumentationPage';
import AdminUsersPage from '../../pages/admin/AdminUsersPage';
import SprintBoardPage from '../../pages/sprint/SprintBoardPage';
import OperationalVisibilityPage from '../../pages/visibility/OperationalVisibilityPage';

export type DashboardSection = 'programs' | 'activities' | 'organizations' | 'people' | 'documentation' | 'admin' | 'sprintBoard' | 'visibility';

export default function DashboardLayout() {
  const [currentSection, setCurrentSection] = useState<DashboardSection>('programs');

  const renderSection = () => {
    switch (currentSection) {
      case 'programs':
        return <ProgramsPage />;
      case 'activities':
        return <ActivitiesPage />;
      case 'organizations':
        return <OrganizationsPage />;
      case 'people':
        return <PeoplePage />;
      case 'documentation':
        return <DocumentationPage />;
      case 'admin':
        return <AdminUsersPage />;
      case 'sprintBoard':
        return <SprintBoardPage />;
      case 'visibility':
        return <OperationalVisibilityPage />;
      default:
        return <ProgramsPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SideNav currentSection={currentSection} onSectionChange={setCurrentSection} />
      <div className="flex flex-1 flex-col">
        <Header currentSection={currentSection} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl p-6">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
