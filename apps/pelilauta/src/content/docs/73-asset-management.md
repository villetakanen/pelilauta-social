---
name: "Asset Management in Pelilauta.social"
shortname: 'Asset Management'
noun: 'veil-advance'
---

The asset management strategy for Pelilauta.social, built on Firebase.

**Key Principles:**

* **Organization:** Assets are organized hierarchically, mirroring the structure of the application (Threads, Sites, Accounts).
* **Efficiency/Privacy/IP:**  Storage usage is optimized by deleting assets when associated content is removed.
* **Security:** Access control rules are implemented to ensure data privacy and prevent unauthorized access.

Assets are not consireder Entries in the CMS sense. Instead, they are seen as attachments to other content types (Threads, Sites, Accounts). Thus they do not have the Entry-related fields or metadata.

Assets are owned by the current entry they are attached to. When an entry is deleted, the associated assets are also deleted. This is done to prevent orphaned assets from accumulating in the storage. Any user who can edit the entry can also manage the assets attached to it.

**Asset Locations:**

* **Threads:** Each thread with associated assets will have a corresponding folder in Firebase Storage. The folder name will match `/Threads/{threadId}/`.
* **Sites:**  Similar to threads, each site with assets will have a dedicated folder in Firebase Storage. The folder name will match `/Sites/{siteId}/`.
* (**Accounts:** Each user account will have a storage folder in `/Accounts/{userId}/` for their personal assets.)


