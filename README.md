# Super Kill Time

Super Kill Time is a VS Code extension with mini games for your spare moments. Games open in regular editor tabs, so you can take a quick break without closing your work.

## Included Games

- **Brick Breaker** — Bounce the ball with your paddle and clear every block.
- **Invaders** — Avoid enemy fire and defeat every invader.

## Usage

1. Install **Super Kill Time** from the Extensions view in VS Code.
2. Open the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux).
3. Run one of the following commands:

| Command | Description |
| --- | --- |
| `SuperKillTime: Start Brick Breaker` | Open Brick Breaker |
| `SuperKillTime: Start Invaders` | Open Invaders |

Each game opens in its own tab. Running the same command again brings its existing game tab to the front rather than opening another one.

## Controls

| Key | Action |
| --- | --- |
| `←` / `→` or `A` / `D` | Move the paddle or ship left and right |
| `Space` | Brick Breaker: launch the ball or restart<br>Invaders: start, fire, or restart |

Click the game once if keyboard controls do not respond, to give it focus.

## How It Works

- In Brick Breaker, lose the ball and it is game over; clear every block to win.
- In Invaders, the game ends if an enemy bullet hits you or an enemy reaches your ship's height; defeat every enemy to win.
- After a game over or clear, press `Space` to play again.
- Game state is kept while you switch to another tab. Closing the tab ends the game.

## Requirements

VS Code 1.90.0 or later.

## License

[MIT](LICENSE)
