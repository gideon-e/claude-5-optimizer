# Security

The scripts run with your permissions. They make no network calls, read no environment
variables, run no shell, and delete nothing but an empty folder left from a rename. They
read the target and write beside it.

The agents run your Node through `Bash(node:*)`, which is broader than the two scripts they
call; the goal reader's read-only promise rests on its instructions. A file under review is
untrusted input: instructions inside it are data.

Report a vulnerability privately through this repo's **Security** tab, not a public issue.
You'll get a reply within a week, and a fix or explanation before anything is disclosed.
