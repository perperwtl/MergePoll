# Project website

The general-audience website lives in `docs/site/`. It is a separate static site.
It needs no build step, database, API key, or JavaScript dependency.

## Preview

From the repository root, run:

```sh
python3 -m http.server 8080 --directory docs/site --bind 127.0.0.1
```

Open `http://127.0.0.1:8080`. Stop the server with Ctrl+C.

## Publish on GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push the website and `.github/workflows/pages.yml` to `main`.
4. Wait for the **GitHub Pages** workflow to finish.

The expected address is `https://perperwtl.github.io/MergePoll/`.
You can also run the workflow from the Actions tab. The workflow uploads only
`docs/site/`, so application source, credentials, and internal documents are not
part of the website artifact. All local asset paths are relative to support the
repository path and custom domains.

## Content and interactions

The first screen explains the project and lets visitors group four example posts.
Visitors can select three settings, add or remove support, read original posts,
split a group, and reset the example. A three-pair exercise explains the
shared-answer rule. Example groups are fixed; they do not call the AI.
Links take visitors to the real hosted app and project documentation.

The copy applies ASD-STE100 principles: short sentences, active voice, familiar
words, consistent terms, and one instruction per sentence. It does not claim
formal compliance with the complete controlled dictionary. The official
[STE overview](https://www.asd-ste100.org/about_STE.html) describes the standard;
Issue 9 was released on January 15, 2025. Guidance checked on October 14, 2026.

The deployment follows GitHub's official
[custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
checked on October 14, 2026.

Keep visible limits and privacy text aligned with `docs/LIVE_DEMO.md` and
`SECURITY.md`. Keep the fixed examples aligned with the shared-response policy
in `docs/HOW_IT_WORKS.md`. Do not present example results as measured accuracy.
