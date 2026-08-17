# A chrome action's presentation is optional for every container, and one uses it

`specs/design-system/chrome-actions/spec.md` gives a chrome action two presentations,
compact and labelled, and lets any container choose between them by setting
`--cn-chrome-presentation`. Any other value, and no value, is compact.

Five applications now render chrome actions in a bar and a rail
(`specs/pelilauta/{base,library,site,docs,admin}`). The labelled presentation appears in
one place: a rail the reader has expanded. A bar's actions are compact at every size, and a
collapsed rail's are too. So the container-declares-either model carries a choice one
consumer makes one way, and `chrome-actions.css` pays for it throughout — a style query
branch, a second set of `--_labelled-*` tokens, and the fallback ordering between them.

## Remaining change

Narrow the optionality to what the rail asks for, and simplify the stylesheet to match.
State the narrowed contract in the chrome actions spec, and check the rail's spec still
describes what its expanded state does to the actions inside it.
