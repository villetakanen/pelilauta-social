**Title:** Improve Reply Submission UX

**As a** user, **I want to** submit a reply and receive an instant confirmation, **so that** I don't have to wait for the page to load and my workflow isn't interrupted by background processing.

---

### Description

Currently, when a user submits a reply, the client-side `addReply` function performs several tasks sequentially, which can cause a noticeable delay of 2-3 seconds.

To address this, we will refactor the reply submission process by moving the logic to a new server-side API endpoint. The new workflow will only perform the single, most critical task synchronously, with all other updates handled asynchronously in the background.

#### Proposed Workflow:

1. **Client-side:** The form submission will call a new API endpoint (e.g., `POST /api/threads/add-reply`) and pass all form data, including files, as `multipart/form-data`.
    
2. **Server-side:** The API endpoint will perform the following steps:
    
    - **Crucial Task (Synchronous):**
        
        - Parse the incoming form data and upload any attached files to Firebase Storage.
            
        - **Save only the new reply document to the `REPLIES_COLLECTION`.**
            
    - **Early Return:** Immediately after the crucial task is complete, the server will return a **202 "Accepted"** HTTP response to the client. This should happen in under **0.5 seconds**.
        
    - **Background Tasks (Asynchronous):**
        
        - Without waiting for their completion, the server will trigger the remaining non-critical tasks.
            
        - Update the parent thread's `replyCount` and `flowTime` metadata.
            
        - Initialize the reaction document for the new reply.
            
        - Send the notification to the thread owner.
            

### Acceptance Criteria

- The user's form submission receives a successful HTTP response with a status code of **202 Accepted** within **500 milliseconds**.
    
- The new reply document is successfully created in the `REPLIES_COLLECTION` in the database.
    
- The parent thread's `replyCount` and `flowTime` are updated **eventually** (eventual consistency).
    
- The `Reactions` document for the new reply is created in the database.
    
- A notification is sent to the thread owner if the author is different.
    
- Any errors that occur in the background tasks are logged for monitoring but do not prevent the API from returning the `202` response.