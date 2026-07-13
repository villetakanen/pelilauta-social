---
name: "Image Optimization with Netlify Image CDN"
shortname: 'Image Optimization'
noun: 'veil-advance'
---

Pelilauta uses Netlify's Image CDN to automatically optimize images from Firebase Storage at delivery time, providing significant performance improvements without changing upload workflows.

## Overview

All images stored in Firebase Storage (threads, sites, profiles) are automatically optimized through Netlify Image CDN when served to users. This provides:

- **60-80% smaller file sizes** through modern formats (WebP/AVIF)
- **Responsive image delivery** - right size for each device
- **Edge CDN caching** - faster delivery worldwide
- **Zero upload changes** - optimization happens at request time


## Related Documentation

- [Netlify Image CDN Documentation](https://docs.netlify.com/image-cdn/overview/)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Asset Management](/docs/73-asset-management.md)
- [Architecture Overview](/docs/70-architecture.md)
