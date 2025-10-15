# 📚 LibraryMS - Modern Library Management System

A production-ready, scalable SaaS web application for library management, built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system control, user management, service configuration
- **Librarian**: Book inventory, borrowing records, member transactions
- **Member**: Browse books, borrow/return, view history

### Core Functionality
- 🔐 JWT-based authentication with refresh tokens
- 📖 Comprehensive book management
- 👥 User profile management
- 📋 Borrowing and return workflows
- 🔍 Search and filter capabilities
- 📊 Dashboard analytics
- 🔧 Microservices integration (Payment & Delivery)

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript
- **Routing**: React Router v6
- **State Management**: Context API + React Query
- **Styling**: Tailwind CSS + shadcn/ui components
- **HTTP Client**: Axios with interceptors
- **Build Tool**: Vite
- **Backend**: Django + MongoDB (API integration)

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Backend API running at `https://librarymanagementsystem-bl3g.onrender.com`

### Setup Steps

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd library-management-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your API URL
VITE_API_URL=https://librarymanagementsystem-bl3g.onrender.com/api
```

4. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components (Header, Sidebar, etc.)
│   ├── ui/              # shadcn/ui components
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx   # Authentication state management
├── lib/
│   ├── api.ts           # Axios instance & API endpoints
│   └── utils.ts         # Utility functions
├── pages/
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── admin/           # Admin dashboard pages
│   ├── librarian/       # Librarian dashboard pages
│   ├── member/          # Member dashboard pages
│   ├── Index.tsx        # Landing page
│   └── NotFound.tsx     # 404 page
├── App.tsx              # Root component with routing
├── index.css            # Global styles & design system
└── main.tsx             # Application entry point
```

## 🔑 API Integration

The application integrates with the following backend endpoints:

### Authentication
- `POST /users/register/` - User registration
- `POST /users/login/` - User login
- `POST /users/refresh-token/` - Token refresh
- `POST /users/forgot-password/` - Password reset request
- `POST /users/reset-password/` - Password reset confirmation

### User Management
- `GET /users/profile/` - Get user profile
- `PUT /users/profile/update/` - Update profile
- `GET /users/all-users/` - List all users (admin)
- `PUT /users/update-role/:id/` - Update user role (admin)
- `DELETE /users/delete-user/` - Delete user (admin)

### Books
- `GET /books/` - List books
- `POST /books/create/` - Create book
- `GET /books/:id/` - Get book details
- `PUT /books/:id/update/` - Update book
- `DELETE /books/:id/delete/` - Delete book

### Book Copies
- `GET /copies/` - List book copies
- `POST /copies/create/` - Create copy
- `GET /copies/:id/` - Get copy details
- `PUT /copies/:id/update/` - Update copy
- `DELETE /copies/:id/delete/` - Delete copy

### Borrowing
- `POST /borrow/create/` - Borrow a book
- `PUT /borrow/return/` - Return a book
- `GET /borrow/records/` - List borrow records
- `GET /borrow/member-summary/` - Member borrow summary
- `GET /borrow/member-summary/:id/` - View member summary (librarian)

## 🎨 Design System

The application uses a custom design system defined in `src/index.css`:

- **Primary Color**: Deep indigo (#4F46E5) for professionalism
- **Accent Color**: Warm orange (#EA580C) for interactive elements
- **Typography**: System font stack with proper hierarchy
- **Spacing**: Consistent spacing scale
- **Animations**: Smooth transitions and micro-interactions

## 🚢 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set environment variables in Vercel dashboard**
- Go to Project Settings → Environment Variables
- Add `VITE_API_URL` with your backend URL

### Netlify

1. **Build the project**
```bash
npm run build
```

2. **Deploy the `dist` folder**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security Features

- JWT token authentication with automatic refresh
- Protected routes based on user roles
- Secure password handling
- HTTPS enforcement in production
- XSS protection via React's built-in escaping
- CSRF protection via SameSite cookies

## 🧪 Development Workflow

### Phase 1: ✅ Authentication & Core Layout
- JWT authentication
- Role-based routing
- Sidebar navigation
- Protected routes

### Phase 2: 📋 Dashboard Implementation (Next)
- Admin dashboard with user management
- Librarian dashboard with book management
- Member dashboard with book browsing

### Phase 3: 📚 Book Management (Pending)
- CRUD operations for books
- Book copy management
- Search and filtering

### Phase 4: 🔄 Borrowing System (Pending)
- Borrow workflow
- Return workflow
- Borrow history and status

### Phase 5: 🔧 Microservices (Pending)
- Payment service integration UI
- Delivery service integration UI
- Service configuration

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🤝 Contributing

This is a client project. For any modifications:
1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit for review

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
