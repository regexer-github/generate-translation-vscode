import { ExtensionContext, commands, window } from 'vscode';
import { GenerateTranslation } from './lib';

export const activate = (context: ExtensionContext) => {
    registerCommand(context, 'generateTranslation.generate', generate);
    registerCommand(context, 'generateTranslation.fromSelectedText', fromSelectedText);
};

const generate = async () => {
    const key = await window.showInputBox({
        prompt: `Which key do you want to use?`,
    });

    if (key) {
        GenerateTranslation.generate(key);
    }
};

const fromSelectedText = () => {
    const editor = window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selection = editor.selection;
    const textSelection = editor.document.getText(selection);

    if (!textSelection) {
        window.showWarningMessage('Nothing selected.');
        return;
    }

    GenerateTranslation.fromSelectedText(textSelection);
};
function registerCommand(context: ExtensionContext, commandName: string, callBack: () => void) {
    const command = commands.registerCommand(commandName, callBack);
    context.subscriptions.push(command);
}
