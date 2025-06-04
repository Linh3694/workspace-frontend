# 🎯 Workspace Frontend

[![🚀 Deploy](https://github.com/Linh3694/workspace-frontend/actions/workflows/deploy.yml/badge.svg)](https://github.com/Linh3694/workspace-frontend/actions/workflows/deploy.yml)
[![🧪 Test & Quality Check](https://github.com/Linh3694/workspace-frontend/actions/workflows/test.yml/badge.svg)](https://github.com/Linh3694/workspace-frontend/actions/workflows/test.yml)
[![CI/CD Pipeline](https://github.com/Linh3694/workspace-frontend/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Linh3694/workspace-frontend/actions/workflows/ci-cd.yml)

🚀 **Frontend application cho hệ thống quản lý workspace** được xây dựng với React + TypeScript + Vite

## 🌐 Live Demo

🔗 **Website:** [https://linh3694.github.io/workspace-frontend/](https://linh3694.github.io/workspace-frontend/)

## ⚡ Tech Stack

- **Framework:** React 18 với TypeScript
- **Build Tool:** Vite 6
- **UI Library:** Radix UI + Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Hook Form + Zod
- **Authentication:** Azure MSAL
- **Icons:** Lucide React + React Icons
- **Deployment:** GitHub Pages với GitHub Actions

## 🚀 CI/CD Pipeline

Project sử dụng GitHub Actions để tự động hóa:

### 📦 Build & Test Workflow (`test.yml`)
- ✅ Multi-node testing (Node 18.x, 20.x)
- ✅ ESLint code quality check
- ✅ Build verification
- ✅ Bundle size analysis
- ✅ Security audit
- ✅ Dependency check

### 🚀 Deploy Workflow (`deploy.yml`)
- ✅ Tự động deploy lên GitHub Pages khi push vào `main`
- ✅ Build optimization với code splitting
- ✅ Source maps cho debugging

### 🔄 Full CI/CD Pipeline (`ci-cd.yml`)
- ✅ Comprehensive testing
- ✅ Security checks cho PR
- ✅ Quality gates
- ✅ Automated deployment

## 🛠️ Development

### Prerequisites
- Node.js 18+ hoặc 20+
- npm hoặc yarn

### Quick Start

```bash
# Clone repository
git clone https://github.com/Linh3694/workspace-frontend.git
cd workspace-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Radix + Tailwind)
│   ├── Layout.tsx      # Main layout wrapper
│   └── Header.tsx      # Navigation header
├── pages/              # Route components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Login.tsx       # Authentication
│   ├── Admission/      # Student admission
│   ├── SchoolYear/     # Academic management
│   ├── Student/        # Student information
│   ├── Settings/       # System settings
│   └── Facilities/     # Facility management
├── lib/                # Utilities & configurations
│   ├── api.ts          # API client setup
│   ├── config.ts       # App configuration
│   ├── constants.ts    # App constants
│   └── utils.ts        # Helper functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

## 🔧 Configuration

### Environment Variables
```env
# API Configuration
VITE_API_BASE_URL=your_api_url
VITE_AZURE_CLIENT_ID=your_azure_client_id
VITE_AZURE_TENANT_ID=your_azure_tenant_id
```

### GitHub Pages Setup
1. Kích hoạt GitHub Pages trong repository settings
2. Chọn source: "GitHub Actions"
3. Workflow sẽ tự động deploy khi push vào main branch

## 🎨 Features

- 🔐 **Authentication:** Azure AD integration
- 📊 **Dashboard:** Real-time analytics
- 👥 **User Management:** Role-based access control
- 🎓 **Academic Management:** Classes, subjects, teachers
- 📚 **Student Information:** Profiles, attendance, grades
- 🏢 **Facility Management:** Rooms, resources
- 📱 **Responsive Design:** Mobile-first approach
- 🌙 **Dark Mode:** Theme switching support

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📝 License

This project is licensed under the MIT License.

---

Made with ❤️ in Vietnam 🇻🇳
