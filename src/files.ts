import { Uri, ExtensionContext, TextDocument } from "vscode";
import { workspace } from 'vscode';

export async function getProjects() {
    const packages = await workspace.findFiles('**/package.json', '**/node_modules/**');
    const results = {} as any;
	packages.map((p: Uri) => {
        const pathSplit = p.path.split('/');
        const key = pathSplit[pathSplit.length - 2];
		results[key] = p.path.replace('package.json', '');
    });
    return results;
}

export async function getLocalizations(projects: any) {
    const results = {} as any;
    const filesPromises = Object.keys(projects).map(async (key) => {
        const wholePath = `**/${key}/**/localization/**/strings.json`;
        const files = await workspace.findFiles(wholePath, '**/node_modules/**');
        if (files.length > 0) {
            results[key] = await workspace.findFiles(wholePath, '**/node_modules/**');
        }
    });
    await Promise.all(filesPromises);
    return results;
}

export async function getCurrentProject(context: ExtensionContext, doc: TextDocument): Promise<string> {
    const index = await context.workspaceState.get('index') as any;
    const found = Object.keys(index).find((project: string) => {
        return doc.uri.path.indexOf(project) !== -1;
    });
    return found || '';
}