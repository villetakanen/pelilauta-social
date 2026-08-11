# Design

The Design Vision and high level guidance for Pelilauta v21 and its design system.

## Authority

The v20 Design System established the aesthetic we are now porting to the v18 business logic.
Where that authority is lacking, human supervision is needed for decision.

## Technical writing

We expect all writing in this repository to follow the guidance below, whether a spec, a book, a 
plan, a note, or a comment.

The goal is terse, precise technical writing across the repository.

### Voice

Do
- Keep sentences focused
- Follow the template for the kind of document you are writing
- Match the breadth and the depth of writing, to the domain. A design principles book, might require deep and wide prose, where a component book might suffice with short technical details. A comment in a data model might require background, and a comment in a css file might just be a two word disambiguation. 

Do not
- Include reasoning traces, historical details or rationales.
- Use aphorisms or metaphors
- Restate the sentence in other words, after the sentence.
- Use "X, not Y" or other rhetoric underlines unless Y is a
  mistake the reader would likely make.
- Use a sibling file to understand the "house style" or the "register" we expect to have.

### Audience

Matching language to audience:

- A document for agents or developers — a spec, a plan, a comment — avoids pronouns
  and carries no rationale. The reason for a decision goes in the commit message.
- A document for people using the product — a design-system book, an app info page —
  says "we". A principles book argues its choices, and that argument is its content.
