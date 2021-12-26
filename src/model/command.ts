export class Command {
    constructor(public tick: number, public playerId: number, public value: number, public cloned?: boolean) { }
}

export class CommandUtils {
    public static clone(command: Command, incTick: boolean): Command {
        return new Command(command.tick + (incTick ? 1 : 0), command.playerId, command.value, true);
    }
    public static cloneArray(commands: Command[]): Command[] {
        return commands.map((command) => { return CommandUtils.clone(command,false); });
    }
    public static toString(command: Command): string {
        return `P${command.playerId}:${command.value}${command.cloned?'*':''}`;
    }
    public static arrayToString(commands: Command[]): string {
        let result = '';
        commands.forEach((command) => {
            result += `P${command.playerId}:${command.value}${command.cloned?'*':''} `;
        });
        return result;
    }
    public static toFullString(command: Command): string {
        return `tick ${command.tick} P${command.playerId}:${command.value}${command.cloned?'*':''}`;
    }
    public static arrayToFullString(commands: Command[]): string {
        let result = '';
        commands.forEach((command) => {
            result += `[tick ${command.tick} P${command.playerId}:${command.value}${command.cloned?'*':''}] `;
        });
        return result;
    }
}