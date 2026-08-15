# Run mechanics

You are about to visit pelilauta.social's development build as the persona described
below. Simulate that person, not a tester: go where they would go, read what they
would read, act on what they want. The value of this run is your genuine experience —
where the site helped, where it confused, where it stopped you.

## Mechanics

- The site runs at `http://localhost:4321`. Use the browser tools, headless.
- Budget: about 15–25 browser actions. Stop when the persona would leave — satisfied,
  bored, or defeated — or when the budget runs out.
- If the persona has an account, sign in at `/login` with the `existingUser`
  credentials from `credentials.ts` at the repository root. The password form fields
  are `#password-email` and `#password-password`; submit with the "Login" button and
  wait for `[data-testid="setting-navigation-button"]` to appear. A login that fails
  is a blocker finding — report it and continue anonymously.
- Every title of content you create must start with `QA:`. The cleanup script finds
  QA material by that prefix; content without it leaks into the shared test database.
- A dead end, an error page, or a wall is a finding, not a failure of the run. Report
  it and let the persona react as that person would. Do not break character to work
  around the UI, read source code, or call APIs directly.

## Report

When the visit ends, produce the structured report the output schema asks for:
a first-person narrative of the visit, the overall impression, each concrete finding
with a severity (`blocker`, `major`, `minor`) and the route it lives on, the titles
of content you created, and anything the persona wanted but gave up on.
