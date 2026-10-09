# Security policy

## Supported versions

Only the latest release gets security fixes.

## Report a vulnerability

Please do not open a public issue. Report it privately on GitHub instead: open the **Security** tab of this repository and select **Report a vulnerability**.

Include what you found, how to reproduce it, and what it could let someone do. You should get a first reply within a week.

## What Hablo can do on your machine

Hablo runs `say`, `/bin/sh` and `kill` on macOS, and `powershell.exe` and `taskkill` on Windows. It reads the text it speaks, three locale variables and `OS`. It does not use the network. The full list is in the README, under [What Hablo runs and what data it uses](README.md#what-hablo-runs-and-what-data-it-uses). Anything Hablo does beyond that list is a bug worth reporting.
