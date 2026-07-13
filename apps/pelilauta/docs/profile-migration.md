# Profile Data Migration

## Overview

This document describes how the application handles legacy profile data that may not conform to the current schema.

## Problem

Users with old account data from previous versions of the application might have:
- Legacy field names (e.g., `photoURL` instead of `avatarURL`)
- Missing required fields
- Invalid data types in arrays
- Extra fields that no longer exist

Without proper migration, these users would experience login failures or broken UX when the application tries to parse their profile data.

## Solution

The profile system implements a two-tier approach:

### 1. Try Standard Parsing First

The system first attempts to parse profile data using the `parseProfile()` function, which handles basic defaults like:
- Default nick to `"N.N."` if missing
- Generate username from nick if missing

### 2. Fallback to Migration

If standard parsing fails, the system catches the error and attempts migration using `migrateProfile()`, which:
- Maps legacy field names (e.g., `photoURL` → `avatarURL`)
- Provides sensible defaults for all required fields
- Filters invalid types from arrays
- Handles type coercion for core fields
- Removes empty optional fields

### 3. Final Fallback

If migration also fails, the profile is marked as missing (`$profileMissing.set(true)`), which triggers the profile creation flow.

## Implementation Details

### File Locations

- **Schema & Migration**: `src/schemas/ProfileSchema.ts`
- **Store with Error Handling**: `src/stores/session/profile.ts`
- **Tests**: `test/schemas/ProfileSchema.test.ts`

### Migration Function Signature

```typescript
export function migrateProfile(
  data: Record<string, unknown>,
  key: string,
): Profile
```

### Supported Migrations

| Legacy Field | Current Field | Notes |
|-------------|---------------|-------|
| `photoURL` | `avatarURL` | Legacy field name |
| Missing `nick` | `"N.N."` | Default nickname |
| Missing `username` | Generated from nick | Uses `toFid()` utility |
| Invalid array items | Filtered | Non-string items removed from `tags` and `lovedThreads` |
| Non-string types | Coerced | Core fields (`nick`, `username`, `avatarURL`) converted to strings |

### Error Handling Flow

```
Profile Load
    ↓
Try parseProfile()
    ├─ Success → Profile loaded ✓
    └─ Error → Try migrateProfile()
        ├─ Success → Profile migrated and loaded ✓
        └─ Error → Mark profile as missing
            └─ Trigger profile creation flow
```

## Usage Example

The profile store automatically handles migration transparently:

```typescript
// In src/stores/session/profile.ts
unsubscribe = onSnapshot(profileRef, (snapshot) => {
  if (snapshot.exists()) {
    try {
      // Try standard parsing first
      const profileData = parseProfile(snapshot.data(), snapshot.id);
      $profile.set(profileData);
      $profileMissing.set(false);
    } catch (error) {
      // Fallback to migration
      try {
        const migratedProfile = migrateProfile(snapshot.data(), snapshot.id);
        $profile.set(migratedProfile);
        $profileMissing.set(false);
      } catch (migrationError) {
        // Mark as missing if migration fails
        $profileMissing.set(true);
      }
    }
  }
});
```

## Testing

The migration system is thoroughly tested with 21 test cases covering:
- Valid data parsing
- Legacy field migrations
- Missing field handling
- Type coercion
- Array filtering
- Error cases

Run tests:
```bash
pnpm test -- ProfileSchema.test.ts
```

## Authentication Impact

**Critical**: Profile migration failures do NOT prevent login!

- **Firebase Authentication**: Schema-agnostic, always succeeds
- **Session Cookie**: Works regardless of profile/account data
- **Account Store**: Has similar error handling (treats parse errors as "not found")
- **Profile Store**: Now has migration fallback for resilience

Users with unparseable data will:
1. Successfully authenticate with Firebase
2. See profile creation flow if migration fails
3. Be able to create a new profile that conforms to current schema

## Future Improvements

Consider adding:
1. Schema versioning to detect which migrations to run
2. Automatic profile updates to persist migrated data
3. Admin tools to batch-migrate legacy profiles
4. Logging/metrics to track how often migration is needed