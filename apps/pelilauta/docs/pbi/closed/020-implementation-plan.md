# PBI-020 Implementation Plan: Comprehensive Forum Admin Tool

## Current State Analysis

### Existing Implementation Issues:
✅ **PBI-21 Completed**: NounSelect component is implemented and working with static icon discovery
❌ **Environment Flag Dependency**: Admin tools only work with `SECRET_FEATURE_FLAG_Admin_tools='true'`
❌ **Incomplete CRUD**: Only read operations work, create operations log but don't persist
❌ **No Authentication**: No server-side admin verification
❌ **Limited Functionality**: Statistics refresh works but no edit/delete operations

### Available Infrastructure:
✅ **Authentication Utilities**: `verifySession()`, `tokenToUid()`, `isAdmin()` 
✅ **NounSelect Component**: Ready for icon selection with 60+ icons
✅ **Channel Schema**: Proper TypeScript types and validation
✅ **Cyan Design System**: UI components available
✅ **Firebase Setup**: Client and server configurations ready

## Implementation Phases

### Phase 1: Authentication & Foundation (Current Sprint)
**Goal**: Remove environment flags and establish proper admin authentication

#### Tasks:
1. **Update Admin Page Authentication**
   - Remove `SECRET_FEATURE_FLAG_Admin_tools` dependency
   - Add SSR authentication with `verifySession()` and `isAdmin()`
   - Redirect unauthorized users to login/403 pages
   - Update `AdminTray` component to work without feature flags

2. **Create Base Admin API Structure**
   - Create `/api/admin/channels/` directory structure
   - Implement authentication middleware using `tokenToUid()` and `isAdmin()`
   - Set up proper error responses and status codes
   - Create base API route handlers with auth validation

3. **Update Channel Components Foundation**
   - Fix AddChannelDialog to use proper API calls
   - Update ChannelsAdmin to use authenticated endpoints
   - Add proper error handling and loading states
   - Implement client-side auth guards

#### Acceptance Criteria:
- [ ] Admin pages work in all environments without feature flags
- [ ] Proper SSR authentication prevents unauthorized access
- [ ] Base API structure ready for CRUD operations
- [ ] Components have proper loading/error states

### Phase 2: Channel CRUD Implementation
**Goal**: Complete channel creation, editing, and deletion with validation

#### Tasks:
1. **Create Channel API** (`POST /api/admin/channels`)
   - Validate input using ChannelSchema
   - Generate slugs using `toMekanismiURI()`
   - Check for duplicate slugs
   - Persist to Firestore `meta/threads` document
   - Return proper response with created channel

2. **Update Channel API** (`PUT /api/admin/channels/:slug`)
   - Allow editing name, category, icon, description
   - Validate changes using ChannelSchema
   - Handle slug changes carefully (affect threads)
   - Update Firestore atomically
   - Return updated channel data

3. **Delete Channel API** (`DELETE /api/admin/channels/:slug`)
   - Check for existing threads in channel
   - Provide force delete option or move threads
   - Update meta document
   - Clean up references

4. **Enhanced UI Components**
   - Inline editing for channel properties
   - Delete confirmations with thread count warnings
   - Real-time updates after operations
   - Comprehensive error handling

#### Acceptance Criteria:
- [ ] Channel creation works end-to-end with validation
- [ ] Channel editing preserves data integrity
- [ ] Channel deletion handles existing threads properly
- [ ] UI provides clear feedback for all operations

### Phase 3: Statistics & Organization  
**Goal**: Manual statistics refresh and channel organization features

#### Tasks:
1. **Statistics Management API** (`POST /api/admin/channels/refresh`)
   - Individual channel statistics refresh
   - Bulk refresh all channels with progress
   - Proper thread counting and flow time calculation
   - Atomic updates to prevent race conditions

2. **Topic Management**
   - Add new topics/categories
   - Rename existing topics
   - Delete empty topics
   - Move channels between topics

3. **Enhanced Statistics UI**
   - Progress indicators for refresh operations
   - Real-time statistics display
   - Manual refresh buttons per channel
   - Bulk operations interface

#### Acceptance Criteria:
- [ ] Statistics refresh works reliably for individual and all channels
- [ ] Topic management allows full CRUD operations
- [ ] Channel movement between topics maintains data integrity
- [ ] UI shows progress for long-running operations

### Phase 4: Enhanced UX & Polish
**Goal**: Complete admin experience with professional UI/UX

#### Tasks:
1. **Comprehensive Admin Dashboard**
   - Overview of forum statistics
   - Channel organization by topics
   - Quick action buttons
   - Search and filtering

2. **Advanced UI Features**
   - Drag-and-drop channel reordering
   - Keyboard shortcuts
   - Confirmation dialogs for destructive actions
   - Responsive design for tablets/mobile

3. **Error Handling & Feedback**
   - Comprehensive error messages
   - Success notifications using cn-snackbar
   - Loading states for all async operations
   - Graceful degradation

#### Acceptance Criteria:
- [ ] Admin dashboard provides clear forum overview
- [ ] All operations have proper confirmations and feedback
- [ ] Interface works well on desktop and tablet
- [ ] Error handling is comprehensive and user-friendly

## Technical Decisions

### Authentication Strategy:
- **SSR Pages**: Use `verifySession()` for cookie-based auth in .astro files
- **API Routes**: Use `tokenToUid()` for Bearer token auth
- **Client Components**: Check both `uid` and `authUser` stores to prevent race conditions

### Data Storage:
- **Channels**: Continue using `meta/threads` document with `topics` array
- **Atomic Updates**: Use Firestore transactions for data consistency
- **Validation**: Zod schemas for all input/output validation

### UI Components:
- **NounSelect**: Already implemented, use for icon selection
- **Cyan Design System**: Use cn-snackbar, cn-loader, etc. for consistency
- **Loading States**: Show progress for all async operations
- **Error Handling**: Display user-friendly error messages

### API Design:
```
POST   /api/admin/channels           # Create channel
PUT    /api/admin/channels/:slug     # Update channel  
DELETE /api/admin/channels/:slug     # Delete channel
POST   /api/admin/channels/refresh   # Refresh statistics
POST   /api/admin/topics             # Create/update topics
DELETE /api/admin/topics/:name       # Delete topic
```

## Implementation Timeline

- **Phase 1**: 2-3 days (Current sprint)
- **Phase 2**: 3-4 days  
- **Phase 3**: 2-3 days
- **Phase 4**: 2-3 days
- **Total**: 9-13 days (~2 sprints)

## Risk Mitigation

### Data Safety:
- Always validate input with Zod schemas
- Use Firestore transactions for atomic updates
- Implement confirmation dialogs for destructive operations
- Maintain backup strategies during development

### Performance:
- Implement proper loading states
- Use efficient Firestore queries
- Cache channel data appropriately  
- Optimize for mobile/tablet performance

### Security:
- Double-check admin authentication on all operations
- Validate all inputs server-side
- Use proper HTTPS and secure headers
- Audit log all admin actions

## Success Metrics

1. **Functionality**: All CRUD operations work reliably
2. **Security**: Only authenticated admins can access features
3. **Performance**: Operations complete within reasonable time
4. **UX**: Clear feedback and error handling throughout
5. **Production Ready**: Works in all deployment environments