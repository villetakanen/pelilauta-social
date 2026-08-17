---
name: "RSS Feeds & Syndication"
shortname: 'Syndication'
noun: 'veil-advance'
---

## ATProto

Starting with 17.3.0 we'll repost all threads to the ATProto network. The reposts will be available at the following URLs:
- https://bsky.app/profile/pelilauta.bsky.social

This feature will require the feature flag `SECRET_FEATURE_bsky` to be `true` and setting of `SECRET_bsky_handle`and `SECRET_bsky_password` in the `.env` file. The handle and password can be obtained from the ATProto network.

## RSS Feeds

Starting with 16.1.0 we'll provide RSS feeds for all posts, and for each channel. The feeds will be available at the following URLs:
- https://pelilauta.social/rss/threads.xml (latest 11 public threads)

The feeds will be served from cache (using cache-control: max-age=900).

The content of the posts will be rendered as the threads are rendered in the app, with the following exceptions:
- The content will be truncated to 500 characters or less (excluding HTML tags).
- The content will not include any embedded media (images, videos, etc).
- The content will not include any user-generated content (comments, etc).

## Consent

As RSS feeds are a form of content syndication, we will require the consent of the users to
include their posts in the feeds. This consent will be requested by resetting the EULA for all users
when the feature is released. Users who do not accept the EULA will have their account disabled.

The EULA will include the following clause:
- "I consent to having my posts included in the RSS feeds, and ActivityPub syndication of
Pelilauta.social"

- "Hyväksyn että sovellukseen luomani ketjut ja viestit ovat saatavilla RSS-syötteissä ja 
ActivityPub-syndikoinnissa."

Technically, this is might not be necessary, as the feeds will only include public posts, which are
already visible to anyone. However, we want to make sure that users are aware of the feature and
can opt out from posting to the feeds if they wish. (the sites etc. can be used in hidden mode, even
if the user decides to not use the public functionality of the site).