import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });
console.log('🔐 Loaded GEMINI_API_KEY from:', envPath);
console.log('🔐 GEMINI_API_KEY:', process.env.GEMINI_API_KEY?.slice?.(0, 5), '...');

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage('✅ PatchMind extension activated!');
  console.log('✅ PatchMind activated!');

  const disposable = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      const filePath = document.uri.fsPath;

      // Only trigger on Python files
      if (!filePath.endsWith('.py')) return;

      const fileContent = document.getText();
      const filename = document.uri.path.split('/').pop();

      vscode.window.showInformationMessage(
        `🧠 PatchMind triggered on save: ${filename}`
      );

      const prompt = `You're an AI code assistant. Given the following Python function(s), generate a detailed Google-style docstring for each one:\n\n${fileContent}`;

      const result = await callGemini(prompt);

      if (result) {
        vscode.window.showInformationMessage(
          `📄 Gemini result ready (first 200 chars logged)`
        );
        console.log('🔧 Gemini output:\n', result.slice(0, 200));
        // Future: insert result into document or show as virtual text
      } else {
        vscode.window.showWarningMessage('⚠️ Gemini returned no result.');
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log('🛑 PatchMind deactivated.');
}

async function callGemini(prompt: string): Promise<string | undefined> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      vscode.window.showErrorMessage('❌ GEMINI_API_KEY not found in .env');
      return;
    }

    // Dynamically import node-fetch for CommonJS compatibility
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    type GeminiResponse = {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };

    const data = (await response.json()) as GeminiResponse;

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply;
  } catch (err) {
    console.error('Gemini API error:', err);
    vscode.window.showErrorMessage('❌ Gemini API call failed.');
    return undefined;
  }
}