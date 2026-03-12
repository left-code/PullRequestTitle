const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const jiraProjectKey = core.getInput('jira-project-key', { required: true });
    const jiraIssueUrl = core.getInput('jira-issue-url', { required: true });
    const token = core.getInput('github-token', { required: true });

    const octokit = github.getOctokit(token);
    const { context } = github;

    if (!context.payload.pull_request) {
      core.setFailed('This action only works on pull_request events.');
      return;
    }

    const pr = context.payload.pull_request;
    const title = pr.title;
    const body = (pr.body ?? '').trim();

    // Match: "pdd 123 some text" or "pdd-123 some text" or "pdd 123 *6 some text"
    const match = title.match(new RegExp(`${jiraProjectKey}[\\s\\-]?(\\d+)(?:\\s+\\*\\d+)?(.*)`, 'i'));
    if (!match) {
      core.info('No Jira issue pattern found in title, skipping.');
      return;
    }

    const issueNumber = match[1];
    const remainingText = match[2].trim();
    const jiraIssueNumber = `${jiraProjectKey}-${issueNumber}`;
    const jiraUrl = `${jiraIssueUrl}/browse/${jiraIssueNumber}`;
    const jiraLink = `🔗 Jira: [${jiraIssueNumber}](${jiraUrl})`;

    const newTitle = remainingText ? `${jiraIssueNumber} ${remainingText}` : jiraIssueNumber;
    const newBody = body.includes(jiraUrl)
      ? body
      : body.length > 0
        ? `${body}\n\n${jiraLink}`
        : jiraLink;

    const titleChanged = title !== newTitle;
    const bodyChanged = body !== newBody;

    if (!titleChanged && !bodyChanged) {
      core.info('Nothing to update, skipping.');
      return;
    }

    core.info(`Renaming: "${title}" → "${newTitle}"`);
    core.info(`Adding Jira link: ${jiraUrl}`);

    await octokit.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
      title: newTitle,
      body: newBody,
    });

    core.setOutput('jira-issue-number', jiraIssueNumber);
    core.setOutput('jira-url', jiraUrl);
    core.setOutput('new-title', newTitle);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
