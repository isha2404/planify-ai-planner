The Outlook calendar integration functionality has been removed from this codebase. This includes:

1. The Outlook calendar sync API endpoint (`/api/events/sync/route.ts`)
2. The Outlook OAuth callback handler and sync functionality from the main page component
3. References to the Outlook calendar sync service

If you need to re-implement calendar integration in the future, you'll need to:
1. Create a new calendar sync service
2. Implement the necessary OAuth flow
3. Add API endpoints for calendar synchronization
4. Add UI components for connecting to calendar services
