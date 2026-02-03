import { useState } from 'react';
import AdminOnly from '../../components/auth/AdminOnly';
import { useGetAllUsers, useUpdateUserRole } from '../../hooks/data/useAdminUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRole } from '../../backend';

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useGetAllUsers();
  const updateRole = useUpdateUserRole();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleRoleChange = async (userPrincipal: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ 
        userPrincipal, 
        newRole: newRole as UserRole,
      });
      toast.success('User role updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update user role';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to update user roles');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">User & Role Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage internal team access and roles
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            User management requires backend support for listing all authenticated users. Currently showing users who have created profiles.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No Users Found</h3>
              <p className="text-center text-sm text-muted-foreground max-w-md">
                Users will appear here once they log in and create their profiles.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.principal}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {user.profile?.name || 'Unnamed User'}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono mt-1">
                        {user.principal}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={user.profile?.role === 'Admin' ? 'default' : 'secondary'}>
                        {user.profile?.role || 'No Role'}
                      </Badge>
                      <Select
                        value={user.profile?.role || ''}
                        onValueChange={(newRole) => handleRoleChange(user.principal, newRole)}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
