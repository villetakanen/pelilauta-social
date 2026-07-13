---
name: 'Features'
noun: 'veil-advance'
---

## 16.3.0 Features

New features and improvements:
* No new end user features, this version is a tech stack update

| Status  | Legend                        |
| ------- | ----------------------------- |
| missing | Not implemented               |
| testing | In testing                    |
| done    | Implemented, tested and ready |
| BUG     | Feature has a known bug, does not prevent a release |

### Threads

#### Create Thread

| Feature                      | Status   | Description  |
| ---------------------------- | -------- | ------------ |
| *Front page create action*   | done     | Visible to authenticated, links to create thread route |
| *Forum index create action*  | done     | Visible to authenticated, links to create thread route |
| *Channel page create action* | done     | Visible to authenticated, links to create thread route, presets channel to current |
| *Create thread view*         | done     | Form with title, content, and tags fields |
| *Create thread: title*       | done     | Required, max 30 characters |
| *Field: Content*             | done     | Markdown editor |
| *Field: Content, Paste to*   | done     | Paste from clipboard to thread content field |
| *Field: Name*                | BUG      | Required, max 30 characters |

#### Edit Thread

| Feature                      | Status   | Description  |
| ---------------------------- | -------- | ------------ |
| *Thread edit action*         | done     | Visible to thread author, links to edit thread route |
| *Paste to thread content*    | BUG      | Paste from clipboard to thread content field |
| *Thread name edit*           | BUG      | Required, max 30 characters |

## Account

### Create Account

### Settings

| Feature                      | Status   | Description  |
| ---------------------------- | -------- | ------------ |
| *Account page*               | done     | Visible to authenticated, links to account route |
| *Account page: title*        | done     | View Title|
| *Account page: description*  | done     | View Description |
| *Account page: debug*        | done     | Debug information |

#### Profile Card

| Feature                      | Status   | Description  |
| ---------------------------- | -------- | ------------ |
| *Profile card*               | done     | Visible to authenticated, links to profile page |
| *Profile card: title*        | BUG      | Link to /profile/:id |
| *Profile card: id*           | done     | User ID in ActivityPub format |
| *Profile card: avatar*       | done     | User avatar |
| *Profile card: description*  | done     | User name |

#### Danger Zone

| Feature                        | Status   | Description  |
| ------------------------------ | -------- | ------------ |
| *Danger zone*                  | done     | Open with a button |
| *Danger zone: delete account*  | done     | Button to delete account |
| *Danger zone: verify function* | done     | Verify account deletion field |

## Sites

### Create Site

| Feature                      | Status   | Description  |
| ---------------------------- | -------- | ------------ |
| *Create site view*           | done     | Form with title, system, description, and visibility fields |