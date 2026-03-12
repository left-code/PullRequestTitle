# PR Jira Link Action

> Automatically normalizes Pull Request titles to Jira key format and appends a Jira issue link to the PR description.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-PR%20Jira%20Link-blue?logo=github)](https://github.com/marketplace/actions/pr-jira-link)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

When a PR title matches the pattern `pdd 123 some feature`, this action will:

- ✅ Rename the title to `PDD-123 some feature`
- ✅ Append a Jira issue link to the PR body (only once — no duplicates)
- ✅ Expose outputs like `jira-key`, `jira-url`, and `new-title` for downstream steps

---

## Usage

```yaml
# .github/workflows/pr-title.yml
name: Normalize PR Title

on:
  pull_request:
    types: [opened, edited]

jobs:
  normalize:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - name: Normalize PR title and add Jira link
        uses: vkozlov-sit/pr-jira-link-action@v1
        with:
          jira-project-key: ${{vars.JIRA_PROJECT_KEY}}
          jira-issue-url: ${{ vars.JIRA_URL }}
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `jira-project-key`| ✅ Yes | — | Jira Project Key to be included in the PR title and body, e.g. PDD-123' |
| `jira-issue-url` | ✅ Yes | — | Base URL for Jira issues. Example: `https://yourcompany.atlassian.net/browse` |
| `github-token` | ✅ Yes | `${{ github.token }}` | GitHub token with `pull-requests: write` permission. The default is sufficient in most cases. |

### Setting up `JIRA_ISSUE_URL`

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click the **Variables** tab → **New repository variable**
3. Set **Name** to `JIRA_PROJECT_KEY` and **Value** to your Project Key
4. Set **Name** to `JIRA_ISSUE_URL` and **Value** to your base Jira URL

---

## Outputs

These outputs can be used in subsequent steps within the same job.

| Output | Description | Example |
|--------|-------------|---------|
| `jira-issue-number` | The extracted Jira issue key | `PDD-123` |
| `jira-url` | The full URL to the Jira issue | `https://yourcompany.atlassian.net/browse/PDD-123` |
| `new-title` | The normalized PR title | `PDD-123 fix login bug` |

### Using Outputs in Downstream Steps

```yaml
steps:
  - name: Normalize PR title and add Jira link
    id: jira
    uses: vkozlov-sit/pr-jira-link-action@v1
    with:
      jira-project-key: ${{ vars.JIRA_PROJECT_KEY }}
      jira-issue-url: ${{ vars.JIRA_ISSUE_URL }}

  - name: Print Jira info
    run: |
      echo "Jira Issue Number: ${{ steps.jira.outputs.jira-issue-number }}"
      echo "Jira URL: ${{ steps.jira.outputs.jira-url }}"
      echo "New Title: ${{ steps.jira.outputs.new-title }}"

  - name: Post Jira link to Slack
    uses: slackapi/slack-github-action@v1
    with:
      payload: |
        {
          "text": "New PR linked to ${{ steps.jira.outputs.jira-issue-number }}: ${{ steps.jira.outputs.jira-url }}"
        }
```

> **Note:** Outputs are only set when a Jira issue is found in the PR title and a change is made. Always guard downstream steps with a condition if needed:
> ```yaml
> if: steps.jira.outputs.jira-key != ''
> ```

---

## Title Matching

The action matches PR titles using the following pattern:

| PR Title | Normalized Title | Detected Key |
|----------|-----------------|--------------|
| `pdd 123 fix login` | `PDD-123 fix login` | `PDD-123` |
| `PDD-456 update readme` | `PDD-456 update readme` | `PDD-456` |
| `pdd123 refactor auth` | `PDD-123 refactor auth` | `PDD-123` |
| `pdd 789 *3 hotfix` | `PDD-789 hotfix` | `PDD-789` |
| `feat: add dark mode` | *(skipped, no match)* | — |

---

## PR Body Behavior

- If the PR body is **empty**, the Jira link is added as the only content.
- If the PR body has **existing content**, the Jira link is appended after two newlines.
- If the Jira URL is **already present** in the body, it is not added again.

**Example result:**

```
This PR fixes the login redirect issue on mobile.

🔗 Jira: [PDD-123](https://yourcompany.atlassian.net/browse/PDD-123)
```

---

## Permissions

This action requires `pull-requests: write` to update the PR title and body.

```yaml
permissions:
  pull-requests: write
```

If your repository uses restrictive default workflow permissions, ensure this is set at the job level as shown above.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and build: `npm run build`
4. Commit the `dist/` folder along with your changes
5. Open a pull request

---

## License

[MIT](LICENSE)
