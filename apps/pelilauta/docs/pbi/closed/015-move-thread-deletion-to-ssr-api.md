# PBI-015: Move Thread Deletion to SSR API

## Problem Statement

Thread deletion is currently implemented entirely client-side using Firebase client SDK, which creates several issues:

1. **Security Dependency on Firestore Rules**: Thread deletion security relies entirely on Firestore security rules rather than server-side validation
2. **Complex Client-side Logic**: The deletion process involves multiple Firestore operations (thread deletion + channel count updates) performed directly from the client
3. **Error Handling**: Client-side errors are harder to debug and provide poor user feedback
4. **Testing Isolation**: E2E tests reveal deletion failures that are difficult to isolate due to client-side complexity

## Current Implementation

The `deleteThread()` function in `src/firebase/client/threads/deleteThread.ts`:
- Uses Firebase client SDK to directly delete thread documents
- Updates channel metadata thread counts client-side
- Relies on Firestore security rules for authorization
- Has no server-side validation or business logic

## Proposed Solution

Move thread deletion to server-side API with proper SSR authentication:

### 1. Create Server-side API Endpoint

Create `src/pages/api/threads/[threadKey].ts` with:
- `DELETE` method handler
- Use `tokenToUid()` for authentication
- Server-side authorization checks (thread ownership)
- **Immediate response pattern (202 Accepted)** for optimal UX
- Background processing for non-critical operations
- Proper error handling and logging

### 2. Update Client-side Implementation

Replace current `deleteThread()` function with:
- Use existing `authedDelete` helper for API calls
- Simplified error handling
- Better user feedback

### 3. Benefits

- **Improved Security**: Server-side authorization and validation
- **Better Error Handling**: Structured API responses with specific error codes
- **Optimal Performance**: Immediate 202 Accepted response with background processing
- **Better User Experience**: Instant feedback without waiting for secondary operations
- **Atomic Operations**: Server-side transaction handling for critical operations
- **Easier Testing**: Clear separation between client UI and server logic
- **Consistent Pattern**: Follows existing SSR API patterns in the codebase

## Implementation Steps

1. **Create API Endpoint** (`src/pages/api/threads/[threadKey].ts`)
   - Implement `DELETE` handler with immediate response pattern
   - Add authentication with `tokenToUid()`
   - Add optimized authorization: check ownership first, then admin status if needed
   - Use `isAdmin(uid)` utility from `src/firebase/server/` (create if not exists)
   - **Critical Task (Synchronous)**: Delete thread document from Firestore
   - **Early Return**: Respond with 202 Accepted within 500ms
   - **Background Tasks (Asynchronous)**: Update channel thread counts
   - Add comprehensive error handling and logging

2. **Update Client Helper** (`src/firebase/client/threads/deleteThread.ts`)
   - Replace Firestore operations with `authedDelete()` API call
   - Simplify error handling
   - Remove direct Firestore dependencies
   - **Note**: Client-side admin check may still be needed for UI permissions

3. **Update UI Components**
   - Ensure ConfirmDeleteThread component handles new API responses
   - Update error messages and loading states

4. **Update Tests**
   - Modify E2E tests to work with new API flow
   - Add unit tests for API endpoint
   - Test error scenarios
   - **Test admin override functionality**

5. **Create Server Utilities** (if not exists)
   - Implement `isAdmin(uid)` function in `src/firebase/server/`
   - Ensure proper server-side admin checking utility

## Acceptance Criteria

- [ ] Thread deletion works via `DELETE /api/threads/{threadKey}` endpoint
- [ ] Server-side authentication and authorization implemented
- [ ] **Authorization optimized: check ownership first, then admin status only if needed**
- [ ] **API responds with 202 Accepted within 500 milliseconds**
- [ ] **Thread document deleted immediately (critical task)**
- [ ] **Channel thread count updated asynchronously (background task)**
- [ ] Proper error responses with specific error codes
- [ ] Client-side uses `authedDelete` helper
- [ ] E2E tests pass with new implementation
- [ ] Error handling provides clear user feedback
- [ ] **Background task failures logged but don't affect user experience**
- [ ] **`isAdmin(uid)` utility function exists in `src/firebase/server/` utilities**

## Technical Notes

- Use existing `tokenToUid()` pattern for server-side auth
- Follow existing API endpoint patterns in `src/pages/api/`
- **Authorization Logic**: First check `thread.owners.includes(uid)`, if false then check `isAdmin(uid)`
- **Optimization**: Only call admin utility function if user doesn't own the thread
- **Admin Utility**: `isAdmin(uid)` should be located in `src/firebase/server/` utilities
- **Critical Task**: Thread document deletion must complete before 202 response
- **Background Task**: Channel thread count updates handled asynchronously
- **Error Handling**: Background task failures should be logged but not block user flow
- Consider implementing retry logic for background task failures

## Priority

**Medium** - Improves security and maintainability, fixes current deletion issues identified in E2E testing

## Estimated Effort

**1-2 sprints** - Requires API endpoint creation, client refactoring, and comprehensive testing
