class Input {
    private pressedKeys: boolean[] = [];
    constructor() {
        document.onkeydown = document.onkeyup = (event) => {
            this.pressedKeys[event.keyCode] = event.type === 'keydown';
          };
    }
    public isPressed(keyCode: number): boolean {
        return this.pressedKeys[keyCode];
    }
}

export const input = new Input();