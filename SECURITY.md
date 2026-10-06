# Security

Do not report credentials, private company data, personal data, or exploitable Known vulnerabilities in a public pull request.

Use GitHub's private vulnerability reporting for this repository. If that channel is unavailable, contact a repository maintainer privately rather than opening a public issue.

Include:

- the affected skill or file;
- the risk and likely impact;
- reproduction details that do not expose third-party data;
- any suggested containment.

## Skill trust boundary

Skills are instructions and static assets. They must not contain executable lifecycle hooks, credentials, real customer records, or instructions to bypass Known authorization. Harnesses must use the authenticated Known CLI and remain bounded by the selected user's permissions.
