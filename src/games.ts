export interface GameDefinition {
  /** パネルレジストリのキー */
  id: string;
  /** 完全なコマンドID */
  command: string;
  /** コマンドパレット表示名 */
  commandTitle: string;
  /** Webview の viewType */
  viewType: string;
  /** パネルタブ名 / <title> */
  title: string;
  /** media/ 配下のサブフォルダ名 */
  mediaDir: string;
  /** mediaDir 内のエントリファイル名 */
  entryScript: string;
  /** キャンバス下の操作ヒント文言 */
  hint: string;
}

export const GAMES: GameDefinition[] = [
  {
    id: 'brickBreaker',
    command: 'super-kill-time.startBrickBreaker',
    commandTitle: 'SuperKillTime: ブロック崩しを開始',
    viewType: 'arcadeBrickBreaker',
    title: 'BrickBreaker',
    mediaDir: 'brick-breaker',
    entryScript: 'main.js',
    hint: '← → / A D : パドル移動　　Space : 発射・リスタート'
  },
  {
    id: 'invaders',
    command: 'super-kill-time.startInvaders',
    commandTitle: 'SuperKillTime: インベーダーを開始',
    viewType: 'arcadeInvaders',
    title: 'Invaders',
    mediaDir: 'invaders',
    entryScript: 'main.js',
    hint: '← → / A D : 自機移動　　Space : 発射 / スタート・リスタート'
  }
];
