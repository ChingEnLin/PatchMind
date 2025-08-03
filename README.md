# PatchMind

Generate smart pull request titles and descriptions from your Git diff using Google Gemini ✨

## ✨ Features

- Instantly generate concise, meaningful pull request titles and detailed descriptions from your current Git diff.
- Uses Google Gemini (via the official API) for high-quality, context-aware summaries.
- Ignores changes related only to environment variable values for cleaner PRs.
- Output is shown in a dedicated VS Code Output panel for easy copy-paste.

## 🚀 Usage

1. Open a Git repository in VS Code.
2. Make your code changes and commit as usual.
3. Run the command: `PatchMind: Generate Pull Request Summary` (search in Command Palette).
4. View your AI-generated PR title and description in the "PatchMind PR Summary" output panel.

## 🛠 Requirements

- Node.js v18 or later
- A Google Gemini API key ([get one for free](https://aistudio.google.com/app/apikey))
- Add your API key to a `.env` file at the root of your project:

  ```env
  GEMINI_API_KEY=your-key-here
  ```

## ⚙️ Extension Settings

No custom settings. All configuration is via your `.env` file.

## 🐞 Known Issues

- Only works in Git repositories.
- Requires a remote branch named `dev` (or edit the code to change the base branch).
- Large diffs may hit Gemini API limits.

## 📦 Release Notes

### 0.0.1
- Initial release: Generate PR summaries with Gemini.

---

**Enjoy using PatchMind!**
