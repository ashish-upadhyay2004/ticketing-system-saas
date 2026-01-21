import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  UserCog,
  UsersRound,
  FolderOpen,
  Tags,
  Clock,
  Zap,
  BookOpen,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles?: ('user' | 'agent' | 'admin')[];
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { title: 'nav.dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'nav.tickets', url: '/tickets', icon: Ticket },
      { title: 'nav.newTicket', url: '/tickets/new', icon: PlusCircle, roles: ['user'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { title: 'nav.users', url: '/admin/users', icon: Users, roles: ['admin'] },
      { title: 'nav.agents', url: '/admin/agents', icon: UserCog, roles: ['admin'] },
      { title: 'nav.teams', url: '/admin/teams', icon: UsersRound, roles: ['admin'] },
      { title: 'nav.categories', url: '/admin/categories', icon: FolderOpen, roles: ['admin'] },
      { title: 'nav.tags', url: '/admin/tags', icon: Tags, roles: ['admin'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { title: 'nav.slaRules', url: '/admin/sla-rules', icon: Clock, roles: ['admin'] },
      { title: 'nav.automation', url: '/admin/automation', icon: Zap, roles: ['admin'] },
    ],
  },
  {
    label: 'Resources',
    items: [
      { title: 'nav.knowledgeBase', url: '/admin/knowledge-base', icon: BookOpen, roles: ['agent', 'admin'] },
      { title: 'nav.reports', url: '/admin/reports', icon: BarChart3, roles: ['admin'] },
      { title: 'nav.auditLogs', url: '/admin/audit-logs', icon: FileText, roles: ['admin'] },
    ],
  },
];

export const AppSidebar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const userRole = profile?.role || 'user';

  const getBasePath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'agent') return '/agent';
    return '/user';
  };

  const getTicketPath = () => {
    const base = getBasePath();
    return `${base}/tickets`;
  };

  const getDashboardPath = () => {
    const base = getBasePath();
    return `${base}/dashboard`;
  };

  const resolveUrl = (url: string) => {
    if (url === '/dashboard') return getDashboardPath();
    if (url === '/tickets') return getTicketPath();
    if (url === '/tickets/new') return `${getBasePath()}/tickets/new`;
    return url;
  };

  const filterItemsByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    });
  };

  const isActive = (url: string) => {
    const resolvedUrl = resolveUrl(url);
    return location.pathname === resolvedUrl || location.pathname.startsWith(resolvedUrl + '/');
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold gradient-text">SupportSphere</span>
              <span className="text-xs text-muted-foreground">Helpdesk System</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navSections.map((section) => {
          const filteredItems = filterItemsByRole(section.items);
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const resolvedUrl = resolveUrl(item.url);
                    const active = isActive(item.url);
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={resolvedUrl}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                              active
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                          >
                            <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-foreground')} />
                            {!collapsed && <span>{t(item.title)}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">{profile?.name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {t(`role.${profile?.role || 'user'}`)}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
