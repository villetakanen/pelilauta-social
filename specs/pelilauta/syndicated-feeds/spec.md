---
status: live
---

# Syndicated feeds

## Blueprint

### Context

The Finnish role-playing community does most of its publishing away from Pelilauta, on
its own blogs and news sites. A reader arriving at the front page sees that writing
without subscribing to anything. It is how the front page shows a community that is
alive beyond the threads written here — one part of that page among others, which is why
it having nothing to show is not a failure of the page.

A publisher may be declared guaranteed, which holds it a place in the stream when recency
alone would have left it out. Myrrys, the publishing house that owns the Pelilauta
project, is declared so. Pelilauta is free software rather than a house organ, so the
guarantee acknowledges who sustains the project without handing them the page.

### Architecture

Two parts, and the boundary between them is the JSON.

`apps/pelilauta/src/pages/api/rss-feeds.json.ts` reads the publishers from
`apps/pelilauta/src/_rss-feeds.config.ts`, fetches each feed, and answers with what it
got. Its response carries each publisher's home address and whether it is guaranteed, so
nothing downstream reads the configuration. The route reaches the network: it caches,
it times out, and only it treats a feed as RSS.

The stream renders from that response alone. It parses nothing, carries no feed
address, and holds no publisher's name in its markup — a publisher is added by editing the
configuration. Ordering and the guaranteed rule are a pure function of the response,
separate from the component that renders its result.

The stream is deferred, and its fallback occupies the same region, so a slow publisher
delays nothing else on the page and the page does not jump when the stream arrives.

### Documentation

None. The capability has no book; the front page is its only surface.

### Constraints

The stream holds at most five posts, and shows fewer rather than filling the space.

A guaranteed publisher that returned a post appears in the stream. Guarantees are
honoured in the configuration's order, one at a time, and each takes the place of the
oldest post from a publisher that is not guaranteed. A place a guarantee has taken is
therefore not a place a later guarantee can take, and where the guarantees outnumber the
places, the ones the order reaches first get them.

Posts carry no date. Recency orders the stream and is not something the reader reads.

A reader sees the most recent posts the service has managed to fetch, and one publisher
being unreachable costs its own posts alone. Serving what was last fetched outranks
fetching afresh: a front page that empties out during another publisher's outage is the
failure this prevents. The stream is therefore empty only where nothing has been fetched yet, and an
empty stream is not an error.

Nothing here runs in the browser, and nothing here needs a reader to be signed in.

## Contract

### Definition of Done

- A reader on the front page sees recent posts from every configured publisher in one
  stream, newest first, each naming its publisher and leading to the post.
- A guaranteed publisher that returned a post is on the front page.
- Adding or removing a publisher is a change to the configuration alone.
- The front page renders at the same speed whether the publishers answer or hang.

### Regression Guardrails

- The stream reaches the network only through the route. A feed parser imported into the
  component moves the network into the page's render.
- The stream stays deferred. Without it, the front page's first byte waits on a third
  party.

### Scenarios

```gherkin
Given two publishers with three posts each
When the stream renders
Then the five most recent of the six appear, newest first
And the sixth does not
```

```gherkin
Given a guaranteed publisher whose posts are all older than five others
When the stream renders
Then its most recent post appears
And the oldest post from a publisher that is not guaranteed does not
```

```gherkin
Given two guaranteed publishers, neither among the five most recent posts
When the stream renders
Then the most recent post from each of them appears
And the two oldest posts from publishers that are not guaranteed do not
```

```gherkin
Given a guaranteed publisher that returned no posts
When the stream renders
Then no place is held for it
And the stream renders the posts it has
```

```gherkin
Given one publisher's feed times out and another answers
When the stream renders
Then the answering publisher's posts appear
And the failure is logged
```
