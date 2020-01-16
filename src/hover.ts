import { ExtensionContext, HoverProvider, TextDocument, Position, Hover, MarkdownString } from 'vscode';
import { getCurrentProject } from './files';

export class IleniaHoverProvider implements HoverProvider {
    private context: ExtensionContext;

    public constructor(context: ExtensionContext) {
        this.context = context;
    }

    public async provideHover(document: TextDocument, position: Position): Promise<Hover | undefined> {
        const index = await this.context.workspaceState.get('index') as any;
        if (!index) {
            return undefined;
        }
        const project = await getCurrentProject(this.context, document);
        if (!project) {
            return undefined;
        }
        const { translations } = index[project];


        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const leftTerms = linePrefix.split('"');
        const leftTerm = leftTerms[leftTerms.length-1];

        const lineSuffix = document.lineAt(position).text.substr(position.character);
        const rightTerms = lineSuffix.split('"');
        const rightTerm = rightTerms.length > 0 ? rightTerms[0] : '';
        
        const term = `${leftTerm}${rightTerm}`;

        const translation = translations[term];
        if (!translation) {
            return undefined;
        }

        const header = `| | |\n|---:|---:|\n`;
        const body = Object.keys(translation.languages).map((language: string) => 
            `| **${language}** | ${translation.languages[language]} |`
        ).join('\n');
        const footer = `| | |\n`;

        const markdown = new MarkdownString(`${header}${body}${footer}`);
        markdown.isTrusted = true;
        return new Hover(markdown);
    }
}
