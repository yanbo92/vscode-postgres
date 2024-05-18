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
        const errorMessage = this.validateInput(args);
        if (errorMessage) {
            vscode.window.showInformationMessage(`Invalid or incomplete connection parameters: ${errorMessage}`);
            return;
        }

        const tree = PostgreSQLTreeDataProvider.getInstance();
        let connections = tree.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
        if (!connections) connections = {};

        const id = uuidv1();
        connections[id] = {
            label: args.label,
            host: args.host,
            user: args.user,
            port: args.port || 5432,
            ssl: args.ssl || false,
            database: args.database,
            hasPassword: !!args.password
        };

        // Store password securely if provided and update the hasPassword flag accordingly
        if (args.password) {
            await Global.context.secrets.store(id, args.password);
            connections[id].hasPassword = true; // Set hasPassword to true if password is provided
        } else {
            connections[id].hasPassword = false; // Ensure hasPassword is false if no password is provided
        }

        await tree.context.globalState.update(Constants.GlobalStateKey, connections);
        tree.refresh();
    }

    private validateInput(args: Partial<IConnection>): string | null {
        if (!args) return "Connection arguments are missing.";
        if (!args.host) return "Host is required.";
        if (!args.user) return "User is required.";
        if (args.port === undefined) return "Port is required.";
        if (args.ssl === undefined) return "SSL setting is required.";
        if (!args.database) return "Database name is required.";
        if (!args.password) return "Password is required.";  // Now validating password as a required field
        return null; // If all fields are valid
    }
}
