# Freedom - Modern Full-Stack Application

🚀 **Modern, ölçeklenebilir ve performanslı full-stack uygulaması**

## 🏗️ Teknoloji Stack'i

### Backend
- **[Bun.js](https://bun.sh/)** - Ultra hızlı JavaScript runtime
- **[Elysia.js](https://elysiajs.com/)** - TypeScript-first web framework
- **[Prisma](https://prisma.io/)** - Modern database toolkit
- **[Redis](https://redis.io/)** - Caching ve session management

### Frontend  
- **[Next.js 14](https://nextjs.org/)** - React framework (App Router)
- **[TypeScript](https://typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Modern UI components
- **[Magic UI](https://magicui.design/)** - Advanced UI components

### DevOps & Tools
- **[Turbo](https://turbo.build/)** - Monorepo build system
- **[Docker](https://docker.com/)** - Containerization
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD
- **[Biome](https://biomejs.dev/)** - Linting ve formatting

## ✨ Özellikler

### 🔐 Authentication & Authorization
- **OAuth Integration**: Google ve GitHub ile giriş
- **JWT-based Auth**: Güvenli token sistemi
- **Role-Based Access Control (RBAC)**: Gelişmiş yetkilendirme
- **Session Management**: Redis ile session yönetimi

### 🌐 Real-time Features
- **WebSocket Support**: Gerçek zamanlı iletişim
- **Live Updates**: Anlık veri güncellemeleri
- **Chat System**: Entegre mesajlaşma sistemi
- **Notifications**: Push notification desteği

### 📁 File Management
- **File Upload**: Çoklu dosya yükleme
- **Stream Processing**: Büyük dosyalar için streaming
- **Cloud Storage**: AWS S3/MinIO entegrasyonu
- **Image Processing**: Otomatik optimize ve resize

### ⏰ Background Jobs
- **Cron Jobs**: Zamanlanmış görevler
- **Queue System**: Asenkron işlem kuyruğu
- **Job Monitoring**: İş takip ve yönetimi
- **Error Handling**: Gelişmiş hata yönetimi

### 🎨 Modern UI/UX
- **Responsive Design**: Tüm cihazlara uyumlu
- **Dark/Light Theme**: Tema desteği
- **Progressive Web App (PWA)**: Mobile-first yaklaşım
- **Accessibility**: WCAG uyumlu erişilebilirlik

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler
```bash
# Bun.js kurulumu
curl -fsSL https://bun.sh/install | bash

# Git clone
git clone <repository-url> freedom
cd freedom
```

### Kurulum
```bash
# Dependencies kurulumu
bun install

# Environment dosyalarını kopyala
cp .env.example .env.local

# Database setup
bun run db:generate
bun run db:push

# Development server başlat
bun run dev
```

### Servisler
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database Studio**: http://localhost:5555

## 📁 Proje Yapısı

```
freedom/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Elysia.js backend
│   └── docs/                # Dokümantasyon
├── packages/
│   ├── shared/              # Ortak types ve utilities
│   ├── ui/                  # UI component library
│   ├── auth/                # Authentication library
│   └── database/            # Database schemas ve migrations
├── tools/
│   ├── biome/               # Linting konfigürasyonu
│   └── docker/              # Docker configurations
├── docs/                    # Proje dokümantasyonu
└── turbo.json              # Monorepo konfigürasyonu
```

## 🔧 Development Scripts

```bash
# Development
bun run dev                  # Tüm servisleri başlat
bun run dev:web             # Sadece frontend
bun run dev:api             # Sadece backend

# Build
bun run build               # Production build
bun run build:web           # Frontend build
bun run build:api           # Backend build

# Database
bun run db:generate         # Prisma client generate
bun run db:push             # Schema push
bun run db:studio           # Database studio

# Testing
bun run test                # Tüm testler
bun run test:web            # Frontend testler
bun run test:api            # Backend testler

# Linting & Formatting
bun run lint                # Lint kontrolü
bun run format              # Code formatting
```

## 📚 Dokümantasyon

- 📖 **[Project Architecture](./docs/project.md)** - Detaylı proje mimarisi
- 🛠️ **[Development Guide](./docs/steps.md)** - Geliştirme rehberi
- 🔐 **[Authentication Guide](./docs/auth.md)** - Auth sistemi rehberi
- 🌐 **[WebSocket Guide](./docs/websocket.md)** - WebSocket kullanımı
- 📁 **[File Upload Guide](./docs/upload.md)** - Dosya yükleme rehberi
- ⏰ **[Cron Jobs Guide](./docs/cron.md)** - Cron sistemi rehberi

## 🤝 Katkıda Bulunma

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 Lisans

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 İletişim

- **Developer**: Yusuf
- **Email**: your-email@example.com
- **GitHub**: [@yusufstar](https://github.com/yusufstar)

---

⭐ **Bu projeyi faydalı bulduysanız, yıldız vermeyi unutmayın!** 