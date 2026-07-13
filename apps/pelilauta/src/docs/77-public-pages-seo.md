---
name: 'Public Pages and SEO Structure'
noun: 'chart-line'
---

**(in english only)**

This document describes the public-facing page structure of Pelilauta for search engine optimization and site navigation understanding.

## Overview

Pelilauta consists of two main applications:
1. **Threads App**: Forum-style discussions with channels and threads
2. **Sites App**: Wiki-style campaign sites with pages and resources

## Public Page Structure

### Primary Content Pages

These pages represent the core public content and are optimized for search engine discovery:

**Front Page (`/`)**  
Main landing page showing latest threads and popular sites. The primary entry point for new visitors.

**Channels (`/channels`)**  
Directory of all discussion channels/categories for browsing forum topics.

**Channel Pages (`/channels/[channel]`)**  
Individual channels showing filtered threads by topic (e.g., rules discussions, game reviews).

**Thread Discussions (`/threads/[threadKey]`)**  
Individual discussion threads with replies and community conversations.

**Sites Directory (`/sites`)**  
Browse all public campaign wikis and game sites created by the community.

**Campaign Sites (`/sites/[siteKey]`)**  
Individual campaign wiki home pages with game resources and information.

**Wiki Pages (`/sites/[siteKey]/[pageKey]`)**  
Individual wiki pages within campaign sites (NPCs, locations, lore, etc.).

**Tag Pages (`/tags/[tag]`)**  
Threads filtered by specific hashtags for topic-based browsing.

**Documentation (`/docs/[id]`)**  
Help and information pages about using Pelilauta.

### Supporting Pages

**User Profiles (`/profiles/[uid]`)**  
Public user profile pages showing activity and bio.

**Search (`/search`)**  
Search interface for finding threads, sites, and content.

**Login (`/login`)**  
User authentication page.

**EULA (`/eula`)**  
Terms of service and end-user license agreement.

## Private Pages (Not Indexed)

The following pages are private and not discoverable via search engines:

- **Admin Section** (`/admin/*`) - Site administration tools
- **User Settings** (`/settings`) - Personal preferences
- **Content Creation** (`/create/*`) - Create threads, sites, characters
- **Site Management** (`/sites/[siteKey]/settings`) - Campaign administration
- **Editing Tools** (`/*/edit`, `/*/delete`) - Content editing and moderation
- **Character Keeper** (`/sites/[siteKey]/keeper`) - Private character management
- **Private Handouts** (`/sites/[siteKey]/handouts`) - GM-only materials
- **Character Library** (`/library/characters`) - Members-only character profiles (beta feature, part of upcoming Characters App)

## Search Engine Optimization

All public pages include:
- Descriptive titles and meta descriptions
- Proper heading structure
- Open Graph tags for social media sharing
- Mobile-responsive design
- Fast loading times

Private pages include `noindex, nofollow` directives to prevent search engine indexing.

---

**Related Documentation:**
- [Architecture](./70-architecture.md) - Technical architecture overview
- [Design System](./71-designsystem.md) - UI components and styling

**For Developers:**  
Implementation details and SEO guidelines are documented in PBI-024 (internal documentation).

---

**Last Updated:** October 4, 2025
