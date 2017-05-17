'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';

import BrowserSyncContentProvider from './BrowserSyncContentProvider';
const SCHEME_NAME: string = 'JasonBrowserSync';

function getBrowserSyncUri(uri: vscode.Uri, port: string) {
    if (uri.scheme === SCHEME_NAME) {
        return uri;
    }

    return uri.with({
        scheme: SCHEME_NAME,
        path: uri.fsPath,
        query: port
    });
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-browser-sync" is now active!');

    const contentProvider = new BrowserSyncContentProvider();
    vscode.workspace.registerTextDocumentContentProvider(SCHEME_NAME, contentProvider);

    let disposablePreview = vscode.commands.registerTextEditorCommand('extension.browserSyncAtPanel', startServer);

    context.subscriptions.push(disposablePreview);
}

function startServer() {
    let doc = vscode.window.activeTextEditor.document;
    // let cwd = vscode.workspace.rootPath || path.dirname(doc.uri.fsPath);
    let cwd = path.dirname(doc.uri.fsPath);
    
    // let argsStr = 'start --server --directory --files "*.html"';
    let argsStr = 'start --no-open --server --directory --files "*.html"';
    let options = {
        "cwd": cwd
    };
    
    let bsPath = path.join(__dirname, '../../node_modules/browser-sync/bin/browser-sync.js');
    let cmdStr = `node ${bsPath} ${argsStr}`;
    let browserSync = child_process.exec(cmdStr, options);

    browserSync.stdout.on('data', (data) => {
        console.log('StdOut' + data);

        // try to grep the port 
        let result = data.toString().match(/Local: http:\/\/localhost:(\d+)/);
        if (result){
            let port: string = result[1];
            console.log("parsed port: " + port);

            const editor = vscode.window.activeTextEditor;
            const doc = editor.document;
            let uri = getBrowserSyncUri(doc.uri, port);

            vscode.commands
                .executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two)
                .then(s => console.log('done'), vscode.window.showErrorMessage);
        }
    });

    browserSync.stderr.on('data', (data) => {
        console.error('Error: ' + data);
    });

    browserSync.on('exit', (code) => {
        if (code == 0) {
            console.log("The server is closed");
        } else {
            console.log(`Child exited with code ${code}`);
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {

}