# Security

## What this plugin can reach

The scripts run on your machine with your permissions. They make no network calls, read
no environment variables, run no shell, and delete nothing except an empty folder left
over from a rename. They read the folder you point them at and write beside it.

The two agents run with your Node through `Bash(node:*)`. A file you ask them to review
is untrusted input: instructions found inside it are data, not commands.

## Reporting a problem

Use GitHub's private vulnerability reporting on this repository (the **Security** tab,
**Report a vulnerability**) rather than a public issue. You will get a reply within a
week, and a fix or a written explanation before anything is disclosed.
