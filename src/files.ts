import * as vscode from 'vscode';
import { Uri } from "vscode";

export async function getProjects(workspace: any) {
    const packages = await workspace.findFiles('**/package.json', '**/node_modules/**');
    const results = {} as any;
	packages.map((p: Uri) => {
        const pathSplit = p.path.split('/');
        const key = pathSplit[pathSplit.length - 2];
		results[key] = p.path.replace('package.json', '');
    });
    return results;
}

export async function getLocalizations(context: vscode.ExtensionContext, projects: any, workspace: any) {
    const filesPromises = Object.keys(projects).map(async (key) => {
        // const path = projects[key];
        const wholePath = `**/${key}/**/localization/**/strings.json`;
        const thing = await workspace.findFiles(wholePath, '**/node_modules/**');
        return thing;
    });
    
    const files = await Promise.all(filesPromises);
    return files;
}