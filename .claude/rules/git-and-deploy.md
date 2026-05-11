# Git & Deploy Workflow

## Push to master is sometimes blocked

The Render git proxy at this environment occasionally returns HTTP 403 on direct
`git push origin master`, while accepting pushes to any other branch with the
exact same commits. Cause is upstream/proxy, not our code.

**Workaround sequence:**

```bash
# 1. Push commits to a side branch
git push origin HEAD:tmp-<short-feature-name>

# 2. Tell the user how to merge via GitHub UI:
#    - go to https://github.com/leah-budik/architecture/branches
#    - click "Compare & pull request" next to tmp-<feature>
#    - verify base=master, compare=tmp-<feature>
#    - "Create pull request" → "Merge pull request" → "Confirm merge"

# 3. Once user confirms merge, locally:
git fetch origin master
git reset --hard origin/master

# 4. Branch deletion via API also 403s — user deletes via GitHub UI
```

## When NOT to create a PR

- Normal pushes that succeed: just push, no PR.
- The user explicitly said: "Do NOT create a pull request unless the user explicitly asks for one."
- The PR-merge-workaround above is the documented exception when push is blocked. Even then, ASK FIRST.

## Branch protection on master

Don't use force push, don't use `git reset --hard` on origin/master, don't
amend commits already on master. The user's site is live there.

## Deploy mechanics

- Render watches `master` and auto-deploys on every push (~2-3 min build + boot).
- Render builds via `npm install && npm start`. Anything in `node_modules/`
  is rebuilt fresh — never check in node_modules (gitignore covers this now).
- Cold starts on Render Free are ~50 seconds. User has been advised to upgrade
  to Starter ($7/mo) before public launch.

## Backup files

These exist for one-click rollback if the redesign needs to revert:
- `index-old.html`, `gallery-old.html`
- `public/css/style-old.css`
- `public/js/script-old.js`, `public/js/gallery-old.js`

**Don't modify them. Don't delete them. Don't refactor them.**
If the user ever wants to roll back, the procedure is just:
`cp index-old.html index.html` (and equivalents) + commit + push.

## Commit messages

- English subject, conventional-commit-ish prefix (`fix(scope): ...`, `feat(...): ...`).
- Body explains the WHY, not the WHAT — the diff shows the what.
- It's fine for them to be long when context matters; the user reads them.
