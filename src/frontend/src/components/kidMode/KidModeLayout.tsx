import { useState } from 'react';
import { useGetActiveKidContext, useClearKidContext } from '../../hooks/kidMode/useKidContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, BookOpen, FileText } from 'lucide-react';
import AssignedProgramsPage from '../../pages/kidMode/AssignedProgramsPage';
import ProgramAttachmentsPage from '../../pages/kidMode/ProgramAttachmentsPage';

type KidSection = 'programs' | 'attachments';

export default function KidModeLayout() {
  const [currentSection, setCurrentSection] = useState<KidSection>('programs');
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();
  const { data: activeKidContext } = useGetActiveKidContext();
  const clearKidContext = useClearKidContext();
  const queryClient = useQueryClient();

  const handleExitKidMode = async () => {
    await clearKidContext.mutateAsync();
    queryClient.invalidateQueries();
  };

  const handleViewAttachments = (programId: string) => {
    setSelectedProgramId(programId);
    setCurrentSection('attachments');
  };

  const handleBackToPrograms = () => {
    setCurrentSection('programs');
    setSelectedProgramId(undefined);
  };

  if (!activeKidContext) {
    return null;
  }

  const initials = `${activeKidContext.firstName[0]}${activeKidContext.lastName[0]}`.toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Kid-friendly header */}
      <header className="flex h-20 items-center justify-between border-b-4 border-primary/20 bg-white/80 backdrop-blur-sm px-6 shadow-sm dark:bg-gray-800/80">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hi, {activeKidContext.firstName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentSection === 'programs' ? 'Your Programs' : 'Program Materials'}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-12 rounded-full">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {activeKidContext.firstName} {activeKidContext.lastName}
                </p>
                <p className="text-xs text-muted-foreground">Age {Number(activeKidContext.age)}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExitKidMode} disabled={clearKidContext.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              Exit Kid Mode
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Kid-friendly navigation */}
      <nav className="border-b border-border bg-white/60 backdrop-blur-sm px-6 py-3 dark:bg-gray-800/60">
        <div className="flex gap-2">
          <Button
            variant={currentSection === 'programs' ? 'default' : 'ghost'}
            onClick={handleBackToPrograms}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            My Programs
          </Button>
          {selectedProgramId && (
            <Button
              variant={currentSection === 'attachments' ? 'default' : 'ghost'}
              onClick={() => setCurrentSection('attachments')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Materials
            </Button>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-6xl">
          {currentSection === 'programs' && (
            <AssignedProgramsPage onViewAttachments={handleViewAttachments} />
          )}
          {currentSection === 'attachments' && selectedProgramId && (
            <ProgramAttachmentsPage 
              programId={selectedProgramId} 
              onBack={handleBackToPrograms}
            />
          )}
        </div>
      </main>

      {/* Kid-friendly footer */}
      <footer className="border-t border-border bg-white/60 backdrop-blur-sm py-4 text-center text-sm text-muted-foreground dark:bg-gray-800/60">
        <p>Keep learning and growing! 🌟</p>
      </footer>
    </div>
  );
}
