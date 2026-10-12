# Issue tracker: GitHub

Issues and specs live in GitHub Issues for perperwtl/MergePoll.
Use the gh CLI from this repo.

## Conventions

- Create: gh issue create --title "..." --body-file <file>
- Read: gh issue view <number> --json number,title,body,labels,comments
- List: gh issue list --state open --json number,title,body,labels
- Comment: gh issue comment <number> --body-file <file>
- Label: gh issue edit <number> --add-label "<label>"
- Remove label: gh issue edit <number> --remove-label "<label>"
- Close: gh issue close <number>

Write multiline bodies to a temporary file and use --body-file.

## Pull requests as a triage surface

PRs as a request surface: no.

## Skill instructions

“Publish to the issue tracker” means create a GitHub issue.
“Fetch the relevant ticket” means read the GitHub issue.

## Wayfinding

A map is one issue labelled wayfinder:map. Child tickets use
wayfinder:research, wayfinder:prototype, wayfinder:grilling,
or wayfinder:task.

Link children using GitHub sub-issues when available.
Otherwise, list children in the map and add “Part of #<map>”
to each child.

Use native GitHub issue dependencies when available.
Otherwise, put “Blocked by: #<number>” in the child body.
A ticket is unblocked when all blockers are closed.

Select the first open, unassigned, unblocked child in map order.
Claim it with gh issue edit <number> --add-assignee @me.
Record the result, close the ticket, and update the map’s
Decisions-so-far with a context link.
