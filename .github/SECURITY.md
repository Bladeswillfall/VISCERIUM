# Security policy

VISCERIUM welcomes responsible reports about vulnerabilities in the public Codex, its build and deployment configuration, and the self-hosted services maintained in this repository.

## Report a vulnerability privately

Please use [GitHub Private Vulnerability Reporting](https://github.com/Bladeswillfall/VISCERIUM/security/advisories/new). Do not open a public issue for an unpatched vulnerability, leaked credential, bypass, or exploit.

Include the affected URL or component, the smallest reproducible example you can provide, the impact you observed, and any conditions needed to reproduce it. Please avoid accessing data that is not yours, degrading the service, or testing against other users.

## Scope

Reports concerning the Astro/Starlight site, the VISCERIUM comment gateway, Remark42 deployment configuration, repository automation, and VISCERIUM-owned infrastructure are in scope. Vulnerabilities wholly inside a third-party service or dependency should also be reported to that upstream project where appropriate; a VISCERIUM report is still useful when our configuration makes the issue exploitable here.

## Sensitive information

Never include passwords, OAuth client secrets, private keys, recovery codes, live session cookies, full comment databases, or unnecessary personal data in a public GitHub issue. If a credential may have been exposed, revoke or rotate it first and then investigate the history.

## Disclosure

Please allow time for the issue to be reproduced and mitigated before public disclosure. Once a fix is deployed, a security advisory can document the affected versions and remediation without exposing unrelated private information.
