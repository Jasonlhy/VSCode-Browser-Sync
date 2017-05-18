'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import * as browserSync from 'browser-sync'
import * as portfinder from 'portfinder'

import BrowserSyncContentProvider from './BrowserSyncContentProvider';
const SCHEME_NAME: string = 'JasonBrowserSync';

function getBrowserSyncUri(uri: vscode.Uri, port: number) {
    if (uri.scheme === SCHEME_NAME) {
        return uri;
    }

    return uri.with({
        scheme: SCHEME_NAME,
        path: uri.fsPath,
        query: port.toString()
    });
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-browser-sync" is now active!');

    const contentProvider = new BrowserSyncContentProvider();
    vscode.workspace.registerTextDocumentContentProvider(SCHEME_NAME, contentProvider);

    let disposablePreview = vscode.commands.registerTextEditorCommand('extension.browserSyncAtPanel', startServer);

    context.subscriptions.push(disposablePreview);
}

function openSidePanel(port : number) {
    const editor = vscode.window.activeTextEditor;
    const doc = editor.document;
    let uri = getBrowserSyncUri(doc.uri, port);

    vscode.commands
        .executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two)
        .then(s => console.log('done'), vscode.window.showErrorMessage);
}

function openServer(freePort : number) {
    let doc = vscode.window.activeTextEditor.document;
    // let cwd = vscode.workspace.rootPath || path.dirname(doc.uri.fsPath);
    let cwd = path.dirname(doc.uri.fsPath);
    let files = ["*.html"];
    files = files.map(p => path.join(cwd, p))

    let bs = browserSync.create();
    bs.init(
        {
            // It must use absolute path, canont use relatie path to the cwd such as ["./*.html"],
            open: false,
            port: freePort,
            files: files,
            server: {
                baseDir: cwd,
                directory: true
            }
        },
        function () {
            // I find this method under the debugger not inside the documentation
            let port : number = bs.getOption("port");
            console.log("estbalished port: " + port);
            openSidePanel(port);
        }
    );
}

function startServer() {
    portfinder.getPortPromise()
        .then(openServer)
        .catch(console.log);
}

// this method is called when your extension is deactivated
export function deactivate() {

}