// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getProjects, getLocalizations } from './files';
import { initIndex, buildIndex } from './state';
import { IleniaCompletionItemProvider } from './intelisense';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json


  const projects = await getProjects();
  await initIndex(context, projects);
  const localizationFiles = await getLocalizations(projects);
  await buildIndex(context, localizationFiles);

  let disposable = vscode.commands.registerCommand('extension.helloWorld', (event) => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World');
    console.log(event);
  });

  vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => {
    const scriptExtensions = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
    if (scriptExtensions.includes(doc.languageId) && doc.uri.scheme === "file") {
    console.log(`You opened a ${doc.languageId} file`);
    // Do stuff
    }
  });

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
        ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'], new IleniaCompletionItemProvider(context), '\"'
    )
  );
  console.log('READY !!!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
