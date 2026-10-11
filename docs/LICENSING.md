# Using, modifying and sharing MergePoll

MergePoll is **source available**, under the custom [MergePoll Noncommercial
Share-Alike License 1.0](../LICENSE). This page explains the intent; the LICENSE
is the binding text. It is not AGPL or unmodified PolyForm Noncommercial.

| What you want to do | Permission | Source requirement |
| --- | --- | --- |
| Study, experiment, or run a hobby project | Free for noncommercial purposes | Private changes can stay private |
| Use it for a university class or institutional research | Free for the institution's own activities | Share source if distributing or hosting a modified version |
| Run it for your charity, government, or another institution listed in the license | Free for the institution's own activities | Same source rules |
| Share a fork or compiled copy | Free within permitted purposes | Give recipients the matching complete source under the same license |
| Host a modified version for other users | Free within permitted purposes | Offer those users matching complete source through a visible link |
| Sell hosting, use it in a business, or operate a commercial event | Written permission required, unless the institutional exception applies | As agreed in the commercial license |
| Sell hosting or support to a university as an outside vendor | Written permission required | As agreed in the commercial license |

An ordinary company is not an exempt institution just because it is incorporated.
Institutional tuition, grants, or event fees do not remove the institutional
exception. Institutions still have to follow the source-sharing rules.

## What to share

Provide the source for the **actual version** you distribute or host: your
changes, lockfile, migration files, build scripts, configuration examples and
instructions needed to run it. Keep the license and copyright notices, and
describe your changes. Use this same license for your changes to MergePoll.

Do **not** include API keys, credentials, user questions, local database state or
personal data. Unmodified dependencies retain their own licenses.

Hosted forks should change `SOURCE_URL` in [lib/project.ts](../lib/project.ts)
to the matching source release or commit for their version. The app shows that
link in both the introduction and room footer. You do not have to publish private
experiments, and the license does not require a particular hosting platform.

## Why a custom license?

- [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)
  permits noncommercial and specified institutional use, but does not impose
  this project's source-sharing requirement.
- [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) includes source
  disclosure for modified network services, but permits commercial use.
- The [Open Source Definition](https://opensource.org/osd) requires allowing
  business use. MergePoll's commercial restriction means it should be described
  as source available rather than open source.

The custom license combines the project's chosen requirements. Its compatibility
must be assessed before combining it with code under other restrictive licenses.
It has not been independently reviewed by legal counsel.

## Commercial permission

Email **[perperwtl@gmail.com](mailto:perperwtl@gmail.com)** with your organization,
planned use, deployment model and whether you intend to redistribute changes.
Do not assume that opening an issue or sending a request grants permission.

The public copyright notice uses the maintainer's GitHub handle **perperwtl**.
It does not identify or imply sponsorship by a university. Contributors retain
copyright in their contributions; see the [contribution agreement](../CLA.md).

## Comparison with CVAT Community

Checked 11 October 2026 against [CVAT's repository license](https://github.com/cvat-ai/cvat/blob/develop/LICENSE)
and [README](https://github.com/cvat-ai/cvat#license). The core is MIT; some
third-party dependencies and model assets have separate terms.

| Permission / obligation | MergePoll NC-SA 1.0 | CVAT Community MIT |
| --- | --- | --- |
| Personal and specified institutional use | Free | Free |
| Business use, commercial events, selling hosting | Written permission required outside institutional exception | Allowed |
| Distributed modifications | Matching complete source; same license | Preserve copyright and license notices; source need not be disclosed |
| Hosted modifications | Offer users matching complete source; same license | No source-sharing obligation from MIT |
| Proprietary forks | Restricted by permitted purposes and source-sharing terms | Allowed with notices |
| Standard OSI open-source license | No; custom source-available license | Yes |

**Assessment:** MergePoll is substantially more restrictive. It can discourage
business pilots, paid event organizers and contributors who prefer a standard
license. It fits a deliberate goal of reserving commercial licensing and
requiring shared improvements. If broad adoption like CVAT is the priority,
MIT would remove both barriers; it also allows competitors to keep their forks
private. This review does not change the project's license. Any relicensing
must respect contributor rights and the contribution agreements already granted.
