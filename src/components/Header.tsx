import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../components/ui/navigation-menu";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { BASE_URL } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { MENU_SECTIONS } from "../data/menuConfig";
import type { MenuItem } from "../types/auth";

const ListItem = ({ item }: { item: MenuItem }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          href={item.href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          )}
        >
          <div className="text-sm font-medium leading-none">{item.title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  
  // Filter menu sections based on user permissions
  const filteredMenuSections = useMemo(() => {
    const sections = MENU_SECTIONS.map(section => {
      const filteredItems = section.items.filter(item => {
        const hasPerm = hasPermission(item.permission);
        return hasPerm;
      });
      
      return {
        ...section,
        items: filteredItems
      };
    }).filter(section => section.items.length > 0);
    
    return sections;
  }, [hasPermission]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky p-3 top-0 z-50 w-full rounded-b-xl backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <img
              src="/app-logo-full.svg"
              alt="Logo"
              className="h-16 w-auto mr-4"
            />
            <NavigationMenu className="hidden p-2 sm:ml-6 sm:flex" viewport={false}>
              <NavigationMenuList>
                {filteredMenuSections.map((section) => (
                  <NavigationMenuItem key={section.title} className="p-2">
                    <NavigationMenuTrigger className="font-semibold">
                      {section.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px]">
                        {section.items.map((item) => (
                          <ListItem key={item.href} item={item} />
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <span className="text-sm font-medium">
              Xin chào WISer&nbsp;
              <span className="text-primary font-bold">{user?.fullname ?? "User"}</span>
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  {user?.avatarUrl ? (
                    <AvatarImage
                      src={`${BASE_URL}/uploads/Avatar/${user.avatarUrl}`}
                      alt="avatar"
                      className="object-cover object-top"
                    />
                  ) : (
                    <AvatarFallback>
                        {user?.fullname
                          ? user.fullname
                          .split(" ")
                          .slice(-2)
                          .map((s: string) => s[0])
                          .join("")
                        : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;