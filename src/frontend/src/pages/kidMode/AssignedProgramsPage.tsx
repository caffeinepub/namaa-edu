import { useKidAssignedPrograms } from '../../hooks/kidMode/useKidPrograms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AssignedProgramsPageProps {
  onViewAttachments: (programId: string) => void;
}

export default function AssignedProgramsPage({ onViewAttachments }: AssignedProgramsPageProps) {
  const { data: programs, isLoading } = useKidAssignedPrograms();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your programs...</p>
        </div>
      </div>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>No Programs Yet</CardTitle>
          <CardDescription>
            You don't have any programs assigned yet. Check back soon!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Programs
        </h2>
        <p className="text-muted-foreground">
          Explore the programs you're enrolled in
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card 
            key={program.id} 
            className="overflow-hidden transition-all hover:shadow-lg border-2 hover:border-primary/50"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xl line-clamp-2">{program.name}</CardTitle>
                <Badge variant="secondary" className="shrink-0">
                  Active
                </Badge>
              </div>
              <CardDescription className="line-clamp-3 mt-2">
                {program.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {program.objectives && (
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">
                    What You'll Learn:
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {program.objectives}
                  </p>
                </div>
              )}
              <Button 
                onClick={() => onViewAttachments(program.id)}
                className="w-full gap-2"
                variant="default"
              >
                <FileText className="h-4 w-4" />
                View Materials
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
