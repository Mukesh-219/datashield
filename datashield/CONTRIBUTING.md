# Contributing to DataShield

Thank you for your interest in contributing to DataShield! This guide will help you get started quickly and make sure your improvements fit the project.

## ✅ How to Contribute

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
git clone https://github.com/<your-username>/datashield.git
cd datashield
```
3. **Create a feature branch**:
   ```bash
git checkout -b feature/your-feature-name
```
4. **Install dependencies** for the service you work on:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
   - ML Service: `cd ml-service && pip install -r requirements.txt`
5. **Make your changes**.
6. **Run tests / verify** your work.
7. **Commit with a clear message**.
8. **Push your branch** and open a Pull Request.

## 🌟 Contribution Guidelines

- Follow existing code style and architecture.
- Keep commits small and focused.
- Document significant changes in the README or docs.
- Add or update tests for new features or bug fixes.
- Use descriptive PR titles and include context.

## 🧩 Branch Naming

Use meaningful branch names like:
- `feature/add-scan-status`
- `fix/frontend-alert-list`
- `chore/update-readme`

## 🛠️ PR Checklist

Before opening a pull request, please verify:
- [ ] Code builds successfully
- [ ] No obvious runtime errors or console warnings
- [ ] API changes are documented in `docs/API.md`
- [ ] README is updated for new user-facing features
- [ ] Your branch is up-to-date with `main`
- [ ] Commit messages are clear and concise

## 📝 Reporting Issues

If you find a bug or want to request a feature:
- Search existing issues first
- Create a new issue with a clear title
- Include steps to reproduce the problem
- Add screenshots or logs when relevant

## 🤝 Community Standards

Be respectful, collaborative, and patient. Contributions should make the project easier to use, understand, and maintain.

## 🚀 Thank You

Thanks for helping improve DataShield! Your contributions help make the platform stronger and more useful for everyone.
