import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { Constants } from "../common/constants";
import { Global } from "../common/global";
import { IConnection } from "../common/IConnection";

'use strict';


export class deleteAllConnectionCommand extends BaseCommand {
    async run() {
        let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
        if (!connections || Object.keys(connections).length === 0) {
            vscode.window.showInformationMessage('No connections to delete.');
            return;
        }

        for (const key in connections) {
            if (connections.hasOwnProperty(key)) {
                await Global.context.secrets.delete(key); // Delete each connection secret
            }
        }

        await Global.context.globalState.update(Constants.GlobalStateKey, {}); // Clear all connections from the global state

        PostgreSQLTreeDataProvider.getInstance().refresh(); // Refresh the tree provider to reflect changes
        vscode.window.showInformationMessage('All connections deleted.');
    }
}
