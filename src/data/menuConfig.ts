import type { MenuSection } from '../types/auth';

export const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Học sinh",
    items: [
      {
        title: "Thông tin học sinh",
        href: "/dashboard/students/info",
        description: "Thông tin cơ bản của học sinh",
        permission: "students.info"
      },
      {
        title: "Điểm danh",
        href: "/dashboard/students/attendance",
        description: "Điểm danh học sinh",
        permission: "students.attendance"
      },
      {
        title: "Sổ liên lạc điện tử",
        href: "/dashboard/students/reports",
        description: "Quản lý sổ liên lạc",
        permission: "students.reports"
      },
      {
        title: "Báo cáo học tập",
        href: "/dashboard/students/grades",
        description: "Xem báo cáo học tập",
        permission: "students.grades"
      },
      {
        title: "Vinh danh",
        href: "/dashboard/students/hall-of-honor",
        description: "Danh sách vinh danh học sinh",
        permission: "students.hall-of-honor"
      }
    ]
  },
  {
    title: "Học thuật",
    items: [
      {
        title: "Khối trường",
        href: "/dashboard/academic/grade-levels",
        description: "Danh sách khối trường theo năm học",
        permission: "academic.grade-levels"
      },
      {
        title: "Hệ học",
        href: "/dashboard/academic/educational-programs",
        description: "Danh sách hệ học",
        permission: "academic.educational-programs"
      },
      {
        title: "Chương trình học",
        href: "/dashboard/academic/curriculums",
        description: "Danh sách chương trình học",
        permission: "academic.curriculums"
      },
      {
        title: "Môn học",
        href: "/dashboard/academic/subjects",
        description: "Danh sách môn học",
        permission: "academic.subjects"
      }
    ]
  },
  {
    title: "Giảng dạy",
    items: [
      {
        title: "Năm học",
        href: "/dashboard/teaching/years",
        description: "Tạo năm học mới",
        permission: "teaching.years"
      },
      {
        title: "Lớp",
        href: "/dashboard/teaching/classes",
        description: "Danh sách lớp theo năm học",
        permission: "teaching.classes"
      },
      {
        title: "Giáo viên",
        href: "/dashboard/teaching/teachers",
        description: "Danh sách giáo viên",
        permission: "teaching.teachers"
      },
      {
        title: "Thời khoá biểu",
        href: "/dashboard/teaching/timetables",
        description: "Quản lý thời khoá biểu",
        permission: "teaching.timetables"
      },
      {
        title: "Lịch năm học",
        href: "/dashboard/teaching/school-year-calendar",
        description: "Quản lý lịch năm học",
        permission: "teaching.calendar"
      }
    ]
  },
  {
    title: "Tuyển sinh",
    items: [
      {
        title: "Hồ sơ học sinh",
        href: "/dashboard/admission/profiles",
        description: "Quản lý hồ sơ đăng ký tuyển sinh",
        permission: "admission.profiles"
      },
      {
        title: "Thông tin gia đình",
        href: "/dashboard/admission/families",
        description: "Thông tin gia đình học sinh",
        permission: "admission.families"
      }
    ]
  },
  {
    title: "Tuyển dụng",
    items: [
      {
        title: "Quản lý công việc",
        href: "/dashboard/recruitment/jobs",
        description: "Quản lý các vị trí tuyển dụng",
        permission: "recruitment.jobs"
      },
      {
        title: "Quản lý hồ sơ",
        href: "/dashboard/recruitment/applications",
        description: "Quản lý hồ sơ đã nộp",
        permission: "recruitment.applications"
      }
    ]
  },
  {
    title: "Hành chính - Dịch vụ",
    items: [
      {
        title: "Thực đơn",
        href: "/dashboard/services/menu",
        description: "Quản lý thực đơn hàng ngày",
        permission: "services.menu"
      },
      {
        title: "Quản lý phòng học",
        href: "/dashboard/facilities/rooms",
        description: "Quản lý phòng học và phòng chức năng",
        permission: "facilities.rooms"
      }
    ]
  },
  {
    title: "Thư viện",
    items: [
      {
        title: "Quản lý dữ liệu",
        href: "/dashboard/library/data",
        description: "Quản lý dữ liệu thư viện",
        permission: "library.data"
      },
      {
        title: "Quản lý Sách",
        href: "/dashboard/library/books",
        description: "Quản lý Sách",
        permission: "library.books"
      },
      {
        title: "Hoạt động",
        href: "/dashboard/library/activities",
        description: "Quản lý hoạt động thư viện",
        permission: "library.activities"
      }
    ]
  },
  {
    title: "Ứng dụng",
    items: [
      {
        title: "Phần mềm lật trang",
        href: "/dashboard/application/flippage",
        description: "Phần mềm lật trang",
        permission: "applications.flippage"
      },
      {
        title: "Ticket",
        href: "/dashboard/application/tickets",
        description: "Hệ thống quản lý ticket",
        permission: "application.tickets.user"
      },
      {
        title: "Quản lý Ticket",
        href: "/dashboard/application/tickets/management",
        description: "Hệ thống quản lý ticket",
        permission: "application.tickets.admin"
      },
    ]
  },
  {
    title: "Cài đặt",
    items: [
      {
        title: "Quản lý người dùng",
        href: "/dashboard/settings/users",
        description: "Quản lý và phân quyền người dùng hệ thống",
        permission: "settings.users"
      }
    ]
  }
]; 