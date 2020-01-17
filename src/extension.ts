// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { languages } from 'vscode';
import { getProjects, getLocalizations } from './files';
import {initIndex, buildIndex, rebuildIndex} from './state';
import { findReferences, ReferenceProvider } from "./refs";
import { IleniaCompletionItemProvider } from './intelisense';
import { IleniaHoverProvider } from './hover';
import { CodelensProvider } from './codelens';
import { underline } from './underline';

export const types = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];

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

  let codelensProvider = new CodelensProvider(context.workspaceState.get('index'));
  languages.registerCodeLensProvider('*', codelensProvider);

  vscode.commands.registerCommand("ilenia-lens.codelensAction", (args) => {
    vscode.window.activeTextEditor?.edit((editBuilder) => {
      editBuilder.delete(args);
    });
  });

  vscode.window.onDidChangeActiveTextEditor(async (editor: vscode.TextEditor | undefined) => {
    if (editor) {
      const doc = editor.document;
      if (types.includes(doc.languageId) && doc.uri.scheme === "file") {
        console.log(`You opened a ${doc.languageId} file`);
        await findReferences(context, doc);
      }
    }
  });

  vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
    const doc = event.document;
    if ([...types, 'json'].includes(doc.languageId) && doc.uri.scheme === "file" && doc.isDirty) {
      console.log(`You changed a ${doc.languageId} file`);
      await rebuildIndex(context, doc.uri);
      await findReferences(context, doc);
    }
  });

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      types, new IleniaCompletionItemProvider(context), '\"'
    )
  );
  
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      types, new IleniaHoverProvider(context)
    )
  );

  context.subscriptions.push(
    vscode.languages.registerReferenceProvider({language: 'json'}, new ReferenceProvider(context))
  );

  
  (await underline(context)).forEach(disposable => context.subscriptions.push(disposable));

  context.subscriptions.push(vscode.commands.registerCommand('extension.helloWorld', (event) => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World');
    console.log(event);
  }));

  console.log('READY !!!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
