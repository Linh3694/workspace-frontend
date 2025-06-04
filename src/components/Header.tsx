import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import { BASE_URL } from "../lib/config";

interface ListItemProps {
  className?: string;
  title: string;
  href: string;
  children: React.ReactNode;
}

const ListItem = ({ className, title, href, children }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : { fullname: "User", avatarUrl: "" };
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setUser({ fullname: "User", avatarUrl: "" });
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
                <NavigationMenuItem className="p-2">
                  <NavigationMenuTrigger className="font-semibold">Quản lý học sinh</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/students/info" title="Thông tin học sinh">
                        Thông tin cơ bản của học sinh
                      </ListItem>
                      <ListItem href="/dashboard/students/attendance" title="Điểm danh">
                        Điểm danh học sinh
                      </ListItem>
                      <ListItem href="/dashboard/students/reports" title="Sổ liên lạc điện tử">
                        Chưa có mô tả
                      </ListItem>
                      <ListItem href="/dashboard/students/grades" title="Báo cáo học tập">
                        Chưa có mô tả
                      </ListItem>
                       <ListItem href="/dashboard/students/grades" title="Vinh danh">
                        Chưa có mô tả
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Quản lý Học thuật</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                     
                      <ListItem href="/dashboard/academic/grades" title="Khối trường">
                        Danh sách khối trường theo năm học
                      </ListItem>
                      <ListItem href="/dashboard/academic/educational-programs" title="Hệ học">
                        Danh sách hệ học
                      </ListItem>
                      <ListItem href="/dashboard/academic/curriculums" title="Chương trình học">
                        Danh sách chương trình học
                      </ListItem>
                      <ListItem href="/dashboard/academic/subjects" title="Môn học">
                        Danh sách môn học
                      </ListItem>
                     
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Quản lý Giảng dạy</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/academic/years" title="Năm học">
                        Tạo năm học mới
                      </ListItem>
                      <ListItem href="/dashboard/academic/classes" title="Lớp">
                        Danh sách lớp theo năm học
                      </ListItem>
                     
                      <ListItem href="/dashboard/academic/teachers" title="Giáo viên">
                        Danh sách giáo viên
                      </ListItem>
                      <ListItem href="/dashboard/academic/timetables" title="Thời khoá biểu">
                        Quản lý thời khoá biểu
                      </ListItem>
                      <ListItem href="/dashboard/academic/school-calendar" title="Lịch năm học">
                        Quản lý lịch năm học
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Quản lý Tuyển sinh</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/admission/profiles" title="Hồ sơ đăng ký">
                        Quản lý hồ sơ đăng ký tuyển sinh
                      </ListItem>
                      <ListItem href="/dashboard/admission/families" title="Thông tin gia đình">
                        Thông tin gia đình học sinh
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Cơ sở vật chất</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/facilities/rooms" title="Phòng học">
                        Quản lý phòng học và phòng chức năng
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                 <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Dịch vụ học sinh</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/services/menu" title="Thực đơn">
                        Quản lý thực đơn hàng ngày
                      </ListItem>
                       <ListItem href="/dashboard/services/bus" title="Xe đưa đón">
                        Quản lý xe đưa đón học sinh
                      </ListItem>
                       <ListItem href="/dashboard/services/boarding" title="Bán trú">
                        Quản lý dịch vụ bán trú
                      </ListItem>
                       <ListItem href="/dashboard/services/activities" title="Hoạt động ngoại khóa">
                        Quản lý các hoạt động ngoại khóa
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Ứng dụng</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/flippage" title="Phần mềm lật trang">
                        Phần mềm lật trang
                      </ListItem>
                      <ListItem href="/dashboard/ticket" title="Ticket">
                        Hệ thống quản lý ticket
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">Cài đặt</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] md:grid-cols-2 lg:w-[500px] ">
                      <ListItem href="/dashboard/settings/users" title="Quản lý người dùng">
                        Quản lý và phân quyền người dùng hệ thống
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <span className="text-sm font-medium">
              Xin chào WISer&nbsp;
              <span className="text-primary font-bold">{user.fullname ?? "User"}</span>
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={
                        user.avatarUrl
                          ? `${BASE_URL}/uploads/Avatar/${user.avatarUrl}`
                          : user.avatarUrl
                      }
                      alt="avatar"
                      className="object-cover object-top"
                    />
                  ) : (
                    <AvatarFallback>
                        {user.fullname
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