# Git strategy for AI projects
_Exported on 1/21/2026 at 11:59:57 EST from Cursor (2.3.34)_

---

**User**

Being fairly new to AI assisted coding, what is a good git strategy for a project like what I'm working on now? I'm currently just commiting everything to main, which seems a bit unsafe, but I don't know how to implement git/branching strategies from a more traditional software development project into a project where most of the code is written by AI.

---

**Cursor**

Great question! Let me take a quick look at your project to give you contextual advice.

I can see you're working on a Next.js app with Prisma, tRPC, and various integrations. Here's a practical Git branching strategy that works well with AI-assisted development:

## Recommended Strategy: "Feature Branch + Stable Main"

### The Core Principle
**Never commit directly to `main`** — always use feature branches. This is even *more* important with AI coding because:

1. AI can generate large amounts of code quickly
2. Bugs may not be immediately obvious
3. You want a clean rollback point if something breaks

### Practical Workflow

```
main (always working/deployable)
  │
  ├── feature/tripletex-integration
  ├── feature/dashboard-improvements  
  ├── fix/auth-bug
  └── experiment/try-new-approach
```

### Step-by-Step Process

**1. Before starting any new work:**
```bash
git checkout main
git pull
git checkout -b feature/descriptive-name
```

**2. While working with AI:**
- Commit frequently (every working state)
- Use descriptive commits: `"Add customer search component"` not `"wip"`
- If something breaks, you can easily `git checkout .` or `git reset`

**3. When feature is complete:**
```bash
git checkout main
git merge feature/descriptive-name
git push
git branch -d feature/descriptive-name
```

### Branch Naming Conventions

| Prefix | Use Case |
|--------|----------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `experiment/` | Trying AI suggestions you're unsure about |

### AI-Specific Tips

1. **Use `experiment/` branches liberally** — When AI suggests a major refactor or architectural change, branch off and test it. If it works, merge. If not, delete the branch and try again.

2. **Commit before major AI prompts** — Before asking AI to make significant changes, commit what you have. This gives you a checkpoint.

3. **Atomic commits** — Each commit should be one logical change. This makes it easy to revert specific AI-generated code that turns out to be problematic.

4. **Use `.gitignore` properly** — Make sure generated files, `node_modules`, `.env`, etc. are ignored (looks like you already have this set up).

### Quick Reference Commands

```bash
# Start new feature
git checkout -b feature/my-feature

# Save progress
git add .
git commit -m "Add X functionality"

# Oops, AI broke something - undo uncommitted changes
git checkout .

# Oops, last commit was bad - undo it but keep files
git reset --soft HEAD~1

# Switch back to main
git checkout main

# Merge completed feature
git merge feature/my-feature

# Delete merged branch
git branch -d feature/my-feature
```

### For Solo Projects

You don't need Pull Requests or complex reviews when working alone. The key benefits of branching are:

1. **Safe experimentation** — Try risky AI suggestions without fear
2. **Clean history** — `main` only has working code
3. **Easy rollback** — If a feature doesn't pan out, just delete the branch

This approach gives you safety without the overhead of a full team workflow. Start simple — even just using feature branches consistently will be a huge improvement over committing everything to `main`!

```plaintext
main (always working/deployable)
  │
  ├── feature/tripletex-integration
  ├── feature/dashboard-improvements  
  ├── fix/auth-bug
  └── experiment/try-new-approach
```

```shellscript
git checkout main
git pull
git checkout -b feature/descriptive-name
```

```shellscript
git checkout main
git merge feature/descriptive-name
git push
git branch -d feature/descriptive-name
```

```shellscript
# Start new feature
git checkout -b feature/my-feature

# Save progress
git add .
git commit -m "Add X functionality"

# Oops, AI broke something - undo uncommitted changes
git checkout .

# Oops, last commit was bad - undo it but keep files
git reset --soft HEAD~1

# Switch back to main
git checkout main

# Merge completed feature
git merge feature/my-feature

# Delete merged branch
git branch -d feature/my-feature
```

