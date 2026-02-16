import { Principal } from '@dfinity/principal';
import { UserProfile } from '../../backend';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface OwnerIndicatorProps {
  owner: Principal;
  profile: UserProfile | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export default function OwnerIndicator({ 
  owner, 
  profile, 
  size = 'md',
  showName = true,
  className = ''
}: OwnerIndicatorProps) {
  const displayName = profile?.name || owner.toString();
  
  // Compute initials from display name
  const getInitials = (name: string): string => {
    if (profile?.name) {
      // If we have a profile name, use first letters of first two words
      const words = name.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return words[0].slice(0, 2).toUpperCase();
    }
    // For principal strings, use first two characters
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className={`${textSizeClasses[size]} font-medium text-foreground truncate`}>
          {displayName}
        </span>
      )}
    </div>
  );
}
