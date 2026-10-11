# Using, modifying and sharing MergePoll

Copyright (c) 2026 perperwtl. MergePoll is licensed under
[AGPL-3.0-only](../LICENSE). This guide summarizes the license; the LICENSE
contains the binding terms.

| What you want to do | Permission | Source requirement |
| --- | --- | --- |
| Use it personally, at an institution or at a public event | Allowed under AGPL | Using an unmodified version does not itself require publishing source |
| Use it commercially, sell hosting or operate a commercial event | Allowed under AGPL without paying the maintainer | Follow the applicable distribution and network source-sharing obligations |
| Distribute covered source or executable copies | Allowed under AGPL | Preserve notices and provide corresponding source as required by AGPL |
| Host a modified version for users | Allowed under AGPL | Prominently offer corresponding source to all users interacting remotely |
| Make private changes without distribution or remote user interaction | Allowed under AGPL | No publication required |
| Seek an exemption from AGPL obligations for covered code | Requires a separate agreement | As specified in that agreement |

## What to share

Provide the corresponding source for the actual covered version: your changes,
necessary build and installation scripts, migrations and configuration examples.
Follow AGPL's requirements for notices, modification notices and source delivery.
Sections 1, 4–6 and 13 describe the detailed requirements.

Do not include API keys, credentials, user questions, private database state or
personal data. Third-party dependencies retain their own licenses and notices.

Hosted modified versions should change `SOURCE_URL` in
[lib/project.ts](../lib/project.ts) to the matching source release or commit.
The app shows that link in both the introduction and room footer. A link to
unmodified upstream source does not provide the source of a modified fork.

AGPL does not automatically cover every independent plugin or separate service;
the relationship between the works matters.

## Alternative licensing

For alternative licensing inquiries, open a
[GitHub Issue](https://github.com/perperwtl/MergePoll/issues).
An inquiry does not grant an exemption. A separate agreement can grant
exemptions only for rights the maintainer owns or is authorized to license;
third-party code remains governed by its own terms.

Commercial users who comply with AGPL do not need a separate paid license.
No separate commercial license agreement is currently supplied in this repository.

Contributors retain copyright in their contributions. The
[contribution agreement](../CLA.md) provides rights for alternative licensing
when explicitly accepted. Existing compliant recipients retain the rights
already granted to them under earlier licenses.
