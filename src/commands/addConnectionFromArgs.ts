// Import the necessary modules
import * as vscode from 'vscode';
import BaseCommand from "../common/baseCommand";
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { IConnection } from "../common/IConnection";
import { Constants } from "../common/constants";
import { v1 as uuidv1 } from 'uuid';
import { Global } from "../common/global";

'use strict';

export class addConnectionFromArgsCommand extends BaseCommand {
    async run(args: Partial<IConnection>) {
        if (!this.validateInput(args)) {
            // If validation fails, show an error message and exit
            vscode.window.showInformationMessage('Invalid or incomplete connection parameters. Please check your input.');
            return;
        }

        const tree = PostgreSQLTreeDataProvider.getInstance();

        // Retrieve existing connections or initialize if none
        let connections = tree.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
        if (!connections) connections = {};

        const id = uuidv1(); // Generate a unique ID for the new connection
        // Construct the connection object from provided args
        connections[id] = {
            label: args.label,
            host: args.host,
            user: args.user,
            port: args.port || 5432, // Default port to 5432 if not provided
            ssl: args.ssl || false,  // Default SSL to false if not provided
            database: args.database
        };

        // Store password securely if provided
        if (args.password) {
            await Global.context.secrets.store(id, args.password);
            connections[id].hasPassword = true;
        } else {
            connections[id].hasPassword = false;
        }

        // Update the global state with the new connection list
        await tree.context.globalState.update(Constants.GlobalStateKey, connections);
        tree.refresh(); // Refresh the tree view to show the new connection
    }

    private validateInput(args: Partial<IConnection>): boolean {
        if (!args || !args.host || !args.user || args.port === undefined || args.ssl === undefined || !args.database) {
            return false;
        }
        // Add additional validations as needed
        return true;
    }
}
