# Student Assistant - Quick Reference & Developer Guide

## 🚀 Start Development

```bash
cd c:\Projects\student-assistant
npm install          # Install dependencies (first time only)
npm run dev          # Start development server at http://localhost:3000
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Check code quality
```

## 📁 Key Files

### Components
- `src/components/Onboarding.tsx` - 3-step setup wizard
- `src/components/Dashboard.tsx` - Main analytics view
- `src/components/DomainInputs.tsx` - All input forms (4 types)
- `src/components/LifeActivity.tsx` - Daily routine tracking
- `src/components/Layout.tsx` - Navigation & app shell

### State & Logic
- `src/context/AppContext.tsx` - Global state (useApp hook)
- `src/lib/storage.ts` - LocalStorage persistence
- `src/lib/analytics.ts` - All calculations (30+ functions)
- `src/lib/utils.ts` - 25+ helper functions
- `src/types/index.ts` - Type definitions

### Core Files
- `src/app/page.tsx` - Main application component
- `src/app/layout.tsx` - Root layout (metadata, providers)
- `next.config.js` - Next.js configuration
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker

## 🎯 Common Tasks

### Add a New Domain Type
```typescript
// 1. Add type in src/types/index.ts
export interface YourDomainTask {
  type: 'your_domain';
  date: number;
  // Add your fields
}

// 2. Create input form in DomainInputs.tsx
export function YourDomainInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  // Form implementation
}

// 3. Handle in page.tsx rendering
if (currentTab === 'your_domain') {
  <YourDomainInput ... />
}
```

### Calculate New Analytics
```typescript
// In src/lib/analytics.ts
calculateYourMetric(params: any): number {
  const state = storageService.getState();
  // Calculate your metric
  return result;
}

// Use in Dashboard
const metric = analyticsService.calculateYourMetric(...);
```

### Access App State
```typescript
// In any component
import { useApp } from '@/context/AppContext';

export function MyComponent() {
  const { state, addTask, updateTask } = useApp();
  
  // Read state
  console.log(state.user);
  console.log(state.tasks);
  
  // Modify state
  addTask(taskEntry);
}
```

### Export Data
```typescript
const { exportData, importData } = useApp();

// Export to JSON
const json = exportData();
const blob = new Blob([json], { type: 'application/json' });
// Download...

// Import
importData(jsonString);
```

## 📊 Data Models Quick Reference

### User Profile
```typescript
{
  id: string;
  name: string;
  educationDetails: EducationDetails; // School/JC/College
  createdAt: number;
  lastUpdated: number;
}
```

### Domain
```typescript
{
  id: string;
  name: string;
  isCustom: boolean;
  color: string;           // Hex color
  icon?: string;           // Emoji
  createdAt: number;
}
```

### Task Entry (Academic Example)
```typescript
{
  id: string;
  domainId: string;
  data: {
    type: 'academic';
    date: number;           // Timestamp
    hoursSpent: number;     // Decimal
    subject: string;
    unitStudied: string;
    conceptsCleared: 'Yes' | 'Partial' | 'No';
    revisionDone: boolean;
    notes?: string;
  };
  createdAt: number;
  updatedAt: number;
}
```

## 🔧 Useful Utilities

```typescript
import { 
  generateId,           // Create unique ID
  formatDate,           // "2025-12-25"
  formatDateReadable,   // "Thu, Dec 25, 2025"
  getTodayMidnight,     // Today at 00:00:00
  formatHours,          // "2h 30m"
  timeToHours,          // 2.5 from (2, 30)
  hoursToTime,          // { hours: 2, minutes: 30 }
  isSameDay,            // Check if dates same
  getWeekRange,         // Week start/end
  getMonthRange,        // Month start/end
  calculatePercentage,  // Part/Total
} from '@/lib/utils';
```

## 📈 Analytics API

```typescript
const { analyticsService } = require('@/lib/analytics');

// Calculate metrics
analyticsService.calculateDailyStats(dateNumber);
analyticsService.calculateProductivityScore(hours, tasks);
analyticsService.calculateStreak(domainId);
analyticsService.calculateAverageHoursPerDay(days);
analyticsService.detectBurnoutRisk();
analyticsService.generatePatterns();
analyticsService.getRecommendations();

// Recalculate all
analyticsService.recalculateAllAnalytics();
```

## 💾 Storage API

```typescript
import { storageService } from '@/lib/storage';

// Get state
const state = storageService.getState();

// Save operations
storageService.saveDomain(domain);
storageService.addTask(task);
storageService.updateTask(taskId, updatedTask);
storageService.deleteTask(taskId);
storageService.saveLifeActivity(activity);

// Bulk operations
storageService.saveState(completeState);
storageService.updateAnalytics(analytics);

// Data management
const json = storageService.exportAsJSON();
storageService.importFromJSON(json);
storageService.clearAllData();
```

## 🎨 Styling

### Tailwind Classes Used
```css
/* Layout */
min-h-screen, flex, grid, gap-*

/* Colors */
bg-white, bg-gray-50, bg-blue-500, text-gray-700
border-gray-200, border-blue-500

/* Spacing */
p-4, px-4, py-3, mb-4, space-y-4

/* Effects */
rounded-lg, shadow-lg, hover:, transition-all

/* Responsive */
md:, lg:, grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

### Colors Palette
```
Primary: #3B82F6 (blue-500)
Success: #10B981 (green-600)
Warning: #F59E0B (amber-500)
Error: #EF4444 (red-500)
Neutral: #6B7280 (gray-500)
```

## 🧪 Testing in Browser

```javascript
// Open DevTools Console

// Get current state
const state = JSON.parse(
  localStorage.getItem('student-assistant-app-state')
);
console.log(state);

// Clear data
localStorage.clear();

// Check service worker
navigator.serviceWorker.getRegistrations()
  .then(r => r.forEach(reg => console.log(reg)));

// Check analytics
analyticsService.calculateDailyStats(Date.now());
```

## 🚀 Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No console errors in dev
- [ ] PWA installs on mobile
- [ ] Works offline
- [ ] Data persists across sessions
- [ ] All analytics calculate correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] README updated
- [ ] Environment variables configured
- [ ] Service worker caching works

## 🐛 Debug Mode

```typescript
// Add to any component
useEffect(() => {
  console.log('State updated:', state);
  const analytics = analyticsService.calculateDailyStats(Date.now());
  console.log('Today stats:', analytics);
}, [state]);
```

## 📱 PWA Testing

### Desktop Browser
1. Open DevTools (F12)
2. Go to Application tab
3. Check Manifest, Service Worker
4. Open in Chrome DevTools → Audits → PWA

### Mobile Browser
1. Open on Android/iOS
2. Look for "Add to Home Screen"
3. Install and test offline
4. Check storage in app settings

## 📦 Package Dependencies

```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "eslint": "^8.57.0",
    "tailwindcss": "^3.4.1"
  }
}
```

No additional heavy packages! Lightweight and fast.

## 🎯 Next Steps

1. **Deploy:** Push to GitHub, connect to Vercel
2. **Customize:** Add your branding/colors
3. **Extend:** Add Phase 2 features
4. **Monitor:** Track usage and feedback
5. **Iterate:** Improve based on user behavior

## 💡 Pro Tips

- Use Chrome DevTools for debugging
- Service Worker updates require page reload
- LocalStorage has 5-10MB limit on most browsers
- Timestamps are in milliseconds (Date.now())
- Always use `getTodayMidnight()` for date comparisons
- Export data before clearing everything
- Test PWA on real mobile device

## 🔗 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Questions?** Check IMPLEMENTATION.md for detailed architecture

**Ready to build?** `npm run dev` 🚀
