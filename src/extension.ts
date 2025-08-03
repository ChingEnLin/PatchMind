import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
// Load .env from root directory
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Import GoogleGenAI SDK


export function activate(context: vscode.ExtensionContext) {
  console.log('✅ PatchMind activated!');
  vscode.window.showInformationMessage('✅ PatchMind extension is active!');

  // Register PR Summary Command
  const prCommand = vscode.commands.registerCommand(
    'patchmind.generatePrSummary',
    async () => {
      vscode.window.showInformationMessage('🧠 Generating PR summary...');

      // Get workspace root
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('❌ No workspace folder is open.');
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;

      try {
        const { execSync } = require('child_process');
        const LAST_USED_BRANCH_KEY = 'patchmind.lastBaseBranch';

    // Get last used or default
    const lastBranch = context.globalState.get<string>(LAST_USED_BRANCH_KEY) || 'dev';

    // Prompt the user
    const baseBranch = await vscode.window.showInputBox({
    prompt: 'Enter base branch (e.g., dev, main, release/x)',
    placeHolder: 'dev',
    value: lastBranch,
    });

    if (!baseBranch) {
    vscode.window.showWarningMessage('⚠️ No base branch provided.');
    return;
    }

    // Save it for next time
    await context.globalState.update(LAST_USED_BRANCH_KEY, baseBranch);

    if (!baseBranch) {
    vscode.window.showWarningMessage('⚠️ No base branch provided.');
    return;
    }

    const diff = execSync(`git diff origin/${baseBranch}..HEAD`, {
    cwd: workspaceRoot
    }).toString();

        if (!diff || diff.trim() === '') {
          vscode.window.showWarningMessage(
            '🟡 No diff found between current branch and origin/dev.'
          );
          return;
        }

        const prompt = `You are an expert software engineer. Given the following Git diff, generate:\n\n1. A concise but meaningful pull request title\n2. A detailed, human-readable description of the changes\n\nIgnore any changes that are only related to environment variable values.\n\nGit diff:\n\n${diff}`;

        // Get Gemini API key from env or globalState
        let apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          apiKey = await context.globalState.get<string>('patchmind.geminiApiKey');
        }
        if (!apiKey) {
          apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Gemini API key (will be saved for future use)',
            ignoreFocusOut: true,
            password: true,
          });
          if (!apiKey) {
            vscode.window.showErrorMessage('❌ Gemini API key is required.');
            return;
          }
          await context.globalState.update('patchmind.geminiApiKey', apiKey);
        }

        const result = await callGemini(prompt, apiKey);

        if (result) {
          const panel = vscode.window.createOutputChannel('PatchMind PR Summary');
          panel.appendLine(result);
          panel.show(true);
      vscode.window.showInformationMessage('✅ PR summary generated successfully! View in Output panel (PatchMind PR Summary).');
        } else {
          vscode.window.showErrorMessage('❌ Failed to generate summary.');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage('❌ Error running git diff: ' + err.message);
      }
    }
  );

  context.subscriptions.push(prCommand);
}

export function deactivate() {
  console.log('🛑 PatchMind deactivated.');
}



async function callGemini(prompt: string, apiKey: string): Promise<string | undefined> {
  try {
    // Dynamically import the ESM module
    const { GoogleGenAI } = await import('@google/genai');
    // Pass the API key explicitly
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // response.text contains the generated text
    return response.text;
  } catch (err: any) {
    console.error('Gemini API error:', err);
    vscode.window.showErrorMessage('❌ Gemini API call failed.');
    return undefined;
  }
}