import { ExtensionContext, CompletionItemProvider, TextDocument, Position, CompletionItem, SnippetString } from 'vscode';
import { getCurrentProject } from './files';

export class IleniaCompletionItemProvider implements CompletionItemProvider {
    private context: ExtensionContext;

    public constructor(context: ExtensionContext) {
        this.context = context;
    }

    public async provideCompletionItems(document: TextDocument, position: Position): Promise<CompletionItem[]> {
        const index = await this.context.workspaceState.get('index') as any;
        const project = await getCurrentProject(this.context, document);
        if (!project) { return []; }
        const { translations } = index[project];

        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const terms = linePrefix.split('"');

        // check if it is not a closing quote
        if ((terms.length - 1) % 2 === 0) {
            return [];
        }

        const term = terms[terms.length-1];
        const ids = Object.keys(translations);
        return ids
            .filter((id: string) => id.startsWith(term) || !term)
            .map((id: string) => {
                const item = new CompletionItem(`${id}: ${translations[id].languages['en-US']}`);
            	item.insertText = new SnippetString(id);
                return item;
            });
    }
}
