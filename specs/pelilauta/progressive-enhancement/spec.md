---
status: live
---

# Progressive Enhancement

## Blueprint

### Context

Pelilauta serves community members while publishing human-authored game content
and discussion for outsiders and search engines. Live features give readers a
reason to join while limiting function and Firebase usage for anonymous visits.

### Architecture

This capability governs browser enhancement across Pelilauta sub-applications.
Feature specs define server-rendered content and browser functionality.

[Architecture](../../../docs/ARCHITECTURE.md#progressive-enhancement) governs
preservation of server-rendered content and native interactions.
[Session](../session/spec.md) governs authentication and protected-page
authorization. [Login](../login/spec.md) governs authentication-route redirects.

## Contract

### Required behavior

Server-rendered public content documents, including serialized island properties,
do not vary with the requesting reader's identity. This public-document contract
excludes authentication routes and protected-page authorization.

Public content pages permit shared caching. A signed-in request can receive
the same cached document as an anonymous request.

The member interface on public content pages renders only in the browser.
[Session](../session/spec.md) governs whether the reader has an established signed-in
session. Only readers with an established session receive the member interface and
live data subscriptions. When authentication does not establish a session, public
pages present the signed-out interface. Presenting the signed-out interface does not
clear Firebase authentication.

#### Onboarding visibility

A saved sign-in hint may hide the onboarding callout before first paint while
session verification is pending. The hint enables no member controls or data reads.
Without a hint, the callout appears immediately. Once verification settles,
the callout is hidden for an established session and visible otherwise.

#### Availability

When a live feature becomes unavailable, the page preserves available public
content and identifies the affected feature as unavailable. The member interface
remains visible while the signed-in session remains established.

During an outage, if the application can render a page but cannot obtain the
requested public page’s primary content from the server or a cache, it shows a
page explaining that the content is temporarily unavailable, with a retry action.
That page retains member navigation while the signed-in session remains established.

### Scenarios

| Starting conditions | Action or event | Expected outcome |
| :--- | :--- | :--- |
| A public content page has unchanged content and identical request inputs except authentication credentials. | An anonymous reader, an ordinary signed-in reader, and an owner or administrator request the page. | Neither the rendered HTML nor serialized island properties differ because of the requesting reader's identity. |
