# PBI-041: Thread Labels and Tags

> **Feature:** Allow admins to add tags to threads that persist through user edits

## 📚 Documentation Index

This PBI has multiple documents for different audiences and purposes:

### 1. **Main PBI Document** (`041-admin-managed-thread-tags.md`) - 48KB
**Audience:** Everyone  
**Purpose:** Complete specification with problem statement, solution design, acceptance criteria, testing plan, and implementation phases.

**Read this if you want:**
- Full understanding of the feature and terminology (tags vs labels)
- Problem context and motivation
- Detailed technical specifications
- Complete API and schema documentation
- Testing strategy and success metrics

### 2. **Quick Reference Card** (`041-quick-reference.md`) - 9.6KB
**Audience:** Developers implementing the feature  
**Purpose:** Fast lookup guide with code snippets, common patterns, and quick answers.

**Read this if you want:**
- Quick implementation guidance
- Code snippets to copy/paste
- Common pitfalls and how to avoid them
- Rollback procedures
- Security checklist

### 3. **Implementation Checklist** (`041-implementation-checklist.md`) - 13KB
**Audience:** Developer(s) working on implementation  
**Purpose:** Step-by-step checklist to track progress through all phases.

**Use this to:**
- Track implementation progress
- Ensure nothing is forgotten
- Guide testing and verification
- Coordinate deployment
- Document rollback if needed

### 4. **Summary** (`041-summary.md`) - 8.6KB
**Audience:** Product owners, managers, stakeholders  
**Purpose:** High-level overview of the feature, effort, and benefits.

**Read this if you want:**
- Quick understanding of what's being built
- Estimated effort and timeline
- Key benefits and success metrics
- Risk assessment

## 🎯 Quick Start

**For Product Owners:**
1. Read the Summary first
2. Review acceptance criteria in main PBI
3. Sign off on implementation

**For Developers:**
1. Skim the Summary for context
2. Read the main PBI document thoroughly
3. Keep Quick Reference Card open while coding
4. Follow Implementation Checklist step-by-step

**For Reviewers:**
1. Read main PBI document
2. Use Implementation Checklist to verify completeness
3. Check Quick Reference Card for security items

## 📊 Feature Overview

### Problem
When users edit their threads, all tags are re-extracted from content, causing any moderator-added labels to be lost.

### Solution
Add separate `labels` field to threads that:
- Only admins/moderators can modify
- Never touched by user edits
- Merged with user tags for discovery
- Visually distinct in UI (accent color)

### Terminology
- **Tags** = User-generated (extracted from content)
- **Labels** = Moderator-assigned (manual, persistent)

### Effort Estimate
**10-12 hours** total across 4 phases

### Status
**Open** - Ready for implementation

## 🔑 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Schema | `ThreadSchema.ts` | Add `labels` field |
| Helpers | `threadTagHelpers.ts` | Tag/label combination and checking |
| API | `labels.ts` | Add/remove labels endpoint |
| UI | `LabelManager.svelte` | Label management interface |
| Display | `ThreadInfoSection.astro` | Visual distinction styling |
| Docs | `entry-labels-and-tags.md` | Defines tags vs labels |

## ✅ Acceptance Criteria Summary

- ✓ Admins can add labels to any thread
- ✓ Labels persist through user edits
- ✓ Visual distinction between tags and labels
- ✓ Server-side admin authentication required
- ✓ Combined tags+labels in tag index for discovery
- ✓ No breaking changes to existing features

## 📈 Success Metrics (2 weeks)

- At least 5 threads have labels
- Zero labels lost during user edits
- < 0.5% error rate on operations
- No performance degradation
- Positive admin feedback

## 🚀 Implementation Phases

1. **Schema & Helpers** (2h) - Add `labels` field, create utilities
2. **API Endpoints** (3-4h) - Create label management API
3. **UI Components** (3-4h) - Build label manager interface
4. **Testing & Refinement** (2h) - Full test suite and fixes

## 🔒 Security

- All label operations verified server-side with `isAdmin()`
- `labels` field protected from normal thread updates
- Proper authorization (401/403) responses
- No information leakage in errors

## 🎨 Visual Design

**Labels (mod):** Accent color (official/curated)
**Tags (user):** Standard styling (user-generated)

Both types clickable, leading to tag discovery pages.

## 📚 Documentation

New `/src/docs/entry-labels-and-tags.md` defines:
- Tags = extracted from content
- Labels = manually assigned
- Single source of truth for the distinction

## 📝 Related Documentation

- **PBI-030:** Fix Thread Tags Update (tag index patterns)
- **PBI-031:** Migrate Thread Updates to SSR API (update architecture)
- **PBI-020:** Comprehensive Forum Admin Tool (admin UI patterns)
- **New:** `/src/docs/entry-labels-and-tags.md` (tags vs labels definition)

## 🤔 Questions?

1. Check the **Quick Reference Card** for implementation details
2. Review the **Main PBI Document** for complete specifications
3. Consult the **Implementation Checklist** for step-by-step guidance
4. Ask the team if you're still unsure

---

**Created:** January 2025  
**Status:** Open  
**Priority:** Medium  
**Estimated Effort:** 10-12 hours  
**Risk Level:** Low