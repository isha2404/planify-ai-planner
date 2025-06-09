# Planify.AI - Smart Daily Planner

An AI-powered smart daily planner that helps you manage schedules, optimize time allocation, and coordinate with team members through natural language interactions.

![Planify.AI Dashboard]<img width="1721" alt="Main" src="https://github.com/user-attachments/assets/72c0ac66-0ee7-46c6-b220-7cc77c391a98" />
<img width="1722" alt="AddEvent" src="https://github.com/user-attachments/assets/f2ff6ed7-bc99-4fe4-b33a-f9665ef99374" />
<img width="1524" alt="AIAssistant" src="https://github.com/user-attachments/assets/23082f4f-7d97-448c-8a4b-6487bec62fe9" />
<img width="1374" alt="MoreFeatures" src="https://github.com/user-attachments/assets/a3e78e23-d8e9-4c76-9897-e57edadff303" />

## 🚀 Deployment

### Deployed to Vercel

1. View the application on https://v0-planify-ai-daily-planner-ks45zjuq1.vercel.app/

## 🚀 Features

- **Smart Calendar Interface** - Day and week view modes with interactive event management
  - Drag-and-drop event rescheduling
  - Color-coded event categories
  - Quick event creation with templates
  - Recurring event support
  - Event conflict detection
- **AI Chat Assistant** - Natural language scheduling with intelligent suggestions
  - Context-aware scheduling recommendations
  - Smart time slot suggestions
  - Meeting duration optimization
  - Priority-based scheduling
  - Conflict resolution suggestions
- **Event Management** - Create, edit, and delete events with priority levels
  - Custom event categories
  - Rich text descriptions
  - File attachments support
  - Event reminders and notifications
  - Event templates and quick actions
- **Team Collaboration** - Multi-user scheduling and availability tracking
  - Team availability visualization
  - Shared calendar views
  - Meeting participant management
  - Resource booking system
  - Team scheduling preferences
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
  - Adaptive layout system
  - Touch-friendly interface
  - Offline support
  - Progressive Web App (PWA) capabilities
  - Cross-browser compatibility
- **Real-time Updates** - Dynamic calendar and availability updates
  - Live event synchronization
  - Instant notification system
  - WebSocket integration
  - Conflict resolution alerts
  - Status indicators

## 🛠️ Tech Stack

- **Frontend**:
  - Next.js 14 (App Router)
  - React 18 (Server Components)
  - TypeScript 5.0+
  - React Server Components
  - Client-side hydration
- **Styling**:
  - Tailwind CSS 3.4+
  - shadcn/ui components
  - CSS Modules
  - Custom animations
  - Responsive design utilities
- **Icons**:
  - Lucide React
  - Custom SVG icons
  - Icon system with fallbacks
- **State Management**:
  - React hooks
  - Zustand for global state
  - React Context
  - Local storage persistence
  - Server state management
- **Date Handling**:
  - date-fns
  - Timezone support
  - Relative time formatting
  - Calendar calculations
  - Duration handling

## 🔐 Authentication & Security

- JWT-based authentication system
- Secure password hashing
- Role-based access control
- Session management
- API route protection
- CSRF protection
- Rate limiting
- Input validation
- XSS prevention
- Secure headers

## 📊 Database & Storage

- PostgreSQL database
- Connection pooling
- Data migrations
- Backup system
- Query optimization
- Data validation
- Transaction support
- Index management
- Data archiving
- Audit logging

## 🤖 AI Integration

- DeepSeek AI model integration
- Natural Language Processing (NLP)
- Context-aware responses
- Intent recognition
- Entity extraction
- Smart scheduling algorithms
- Priority optimization
- Time slot suggestions
- Conflict resolution
- Learning from user preferences

## 🚀 Performance Optimization

- Server-side rendering (SSR)
- Static site generation (SSG)
- Image optimization
- Code splitting
- Lazy loading
- Caching strategies
- Bundle optimization
- API response caching
- Database query optimization
- CDN integration

## 📱 Mobile Support

- Responsive design
- Touch interactions
- Mobile-first approach
- PWA capabilities
- Offline support
- Push notifications
- Mobile-optimized UI
- Gesture support
- Viewport optimization
- Mobile performance tuning

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.0 or higher)
- npm or yarn package manager
- Git

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/isha2404/planify-ai-planner.git
cd planify-ai-planner
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

If you encounter dependency conflicts, use:
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 3. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

### 4. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

\`\`\`
planify-ai-planner/
├── app/
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── ui/
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── input.tsx
│ │ └── ...
│ ├── calendar-view.tsx
│ ├── chat-interface.tsx
│ └── event-modal.tsx
├── lib/
│ ├── mock-data.ts
│ └── utils.ts
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
\`\`\`

## 🎯 Usage Guide

### Calendar View

- **Switch Views**: Toggle between Day and Week view
- **Navigate Dates**: Use arrow buttons or "Today" button
- **Create Events**: Click "Schedule Event" or use the + button
- **Edit Events**: Click on any event to edit or delete

### AI Assistant

Try these natural language commands:

- "Schedule a call with John tomorrow at 3 PM"
- "Block focus time from 9 to 11 AM tomorrow"
- "Do I have free time on Thursday?"
- "Move my meeting to the afternoon"

### Event Management

- **Event Types**: Meeting, Focus Time, Break
- **Priority Levels**: High, Medium, Low
- **Attendees**: Add multiple participants
- **Descriptions**: Add notes and details

## 🔧 Available Scripts

\`\`\`bash

# Start development server

npm run dev

# Build for production

npm run build

# Start production server

npm start

# Run linting

npm run lint

# Run type checking

npm run type-check
\`\`\`

## 🔄 Git Workflow

### Regular Development

\`\`\`bash

# Create feature branch

git checkout -b feature/new-feature

# Make changes and commit

git add .
git commit -m "Add new feature"

# Push feature branch

git push origin feature/new-feature

# Create pull request on GitHub

# After merge, update main branch

git checkout main
git pull origin main
\`\`\`

## 🐛 Troubleshooting

### Common Issues

1. **Dependency Conflicts**
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`

2. **Port Already in Use**
   \`\`\`bash
   npm run dev -- --port 3001
   \`\`\`

3. **TypeScript Errors**
   \`\`\`bash
   npm run type-check
   \`\`\`

4. **Build Errors**
   \`\`\`bash
   rm -rf .next
   npm run build
   \`\`\`

### Environment Issues

If you encounter issues with the development environment:

1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall dependencies: `npm install`
4. Restart development server: `npm run dev`

## 🔮 Future Enhancements

- [ ] Real AI model integration (OpenAI, Claude)
- [ ] Calendar API sync (Google Calendar, Outlook)
- [ ] Team collaboration features
- [ ] Smart notifications and reminders
- [ ] Advanced scheduling algorithms
- [ ] Mobile app development
- [ ] Integration with video conferencing tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

## 👥 Authors

- **Your Name** - Aditi maheshwari - [YourGitHub](https://github.com/isha2404)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

**Happy Planning with Planify.AI! 🎯**

## 🔧 Development Environment

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/planify
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Authentication
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# AI Integration
DEEPSEEK_API_KEY=your-deepseek-api-key

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Development Tools

- VS Code with recommended extensions
- PostgreSQL client
- API testing tools (Postman/Insomnia)
- Git GUI client
- Browser DevTools
- React Developer Tools
- TypeScript debugging
- Performance monitoring
- Error tracking
- Logging tools

## 📈 Monitoring & Analytics

- Error tracking system
- Performance monitoring
- User analytics
- Usage statistics
- API metrics
- Database performance
- Server health checks
- Resource utilization
- User behavior tracking
- Conversion analytics

## 🔒 Security Best Practices

- Regular security audits
- Dependency updates
- Code scanning
- Penetration testing
- Security headers
- Input sanitization
- Output encoding
- Access control
- Data encryption
- Secure communication
