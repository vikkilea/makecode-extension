//% color="#d48c26" weight=90 icon="\uf279"
namespace tiles {
    // ---------------------------------------------------------------------
    // Movement helpers (unchanged)
    // ---------------------------------------------------------------------
    /**
     * Move a sprite to a specific tile location at a given speed.
     * Straight‑line movement; no path‑finding.
     */
    //% block="move $sprite to tile col $col row $row at speed $speed"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Movement"
    export function moveSpriteToTile(sprite: Sprite, col: number, row: number, speed: number) {
        const tileSize = 16; // default tile size in Arcade
        const targetX = col * tileSize + tileSize / 2;
        const targetY = row * tileSize + tileSize / 2;
        const dx = targetX - sprite.x;
        const dy = targetY - sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2) {
            sprite.setVelocity(0, 0);
            sprite.setPosition(targetX, targetY);
            return;
        }
        const ratio = speed / dist;
        sprite.setVelocity(dx * ratio, dy * ratio);
        const handler = () => {
            const curDx = targetX - sprite.x;
            const curDy = targetY - sprite.y;
            const curDist = Math.sqrt(curDx * curDx + curDy * curDy);
            if (curDist < speed / 30) {
                sprite.setVelocity(0, 0);
                sprite.setPosition(targetX, targetY);
                game.removeScenePushHandler(handler);
            }
        };
        game.addScenePushHandler(handler);
    }

    /**
     * Teleport a sprite directly to a tile.
     */
    //% block="teleport $sprite to tile col $col row $row"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Movement"
    export function teleportToTile(sprite: Sprite, col: number, row: number) {
        const tileSize = 16;
        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;
        sprite.setPosition(x, y);
    }

    // ---------------------------------------------------------------------
    // Tile interaction API (highlight & press handling)
    // ---------------------------------------------------------------------
    /**
     * Handler type for a tile "press" (A button) when a sprite of the player kind
     * is standing on the tile.
     */
    //% shim=functions
    export type TilePressHandler = (loc: tiles.Location) => void;

    /**
     * Internal record for a highlighted tile.
     */
    interface HighlightRec {
        kind: number;          // Sprite kind that triggers the highlight
        original: Image;       // Original tile image
        highlight: Image;      // Image shown while a matching sprite is on the tile
        active: boolean;       // Whether the tile is currently highlighted
    }

    // Maps "col,row" -> HighlightRec
    const highlightMap: { [key: string]: HighlightRec } = {};
    // Maps "col,row" -> press handler
    const pressMap: { [key: string]: TilePressHandler } = {};

    /**
     * Register a tile to change its sprite when a sprite of the given kind touches it.
     * The tile at (col,row) will show `highlight` while any sprite of that kind is on it,
     * and revert to its original image when none are.
     */
    //% block="highlight tile at col $col row $row when kind $kind touches it with $highlight"
    //% col.min=0 col.max=15
    //% row.min=0 row.max=15
    //% highlight.shadow=screen_image_picker
    //% group="Tile Interaction"
    export function setTileHighlight(col: number, row: number, kind: number, highlight: Image) {
        const key = `${col},${row}`;
        const loc = tiles.getTileLocation(col, row);
        const original = tiles.getTileImage(loc);
        highlightMap[key] = { kind, original, highlight, active: false };
    }

    /**
     * Check if any sprite of the given kind is currently on the tile at (col,row).
     */
    //% block="is kind $kind on tile col $col row $row"
    //% col.min=0 col.max=15
    //% row.min=0 row.max=15
    //% group="Tile Interaction"
    export function isKindOnTile(kind: number, col: number, row: number): boolean {
        const spritesOfKind = sprites.allOfKind(kind);
        const targetLoc = tiles.getTileLocation(col, row);
        for (const s of spritesOfKind) {
            if (s.tilemapLocation().equals(targetLoc)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Register a handler that runs when the A button is pressed while the player
     * (SpriteKind.Player) stands on the tile at (col,row).
     */
    //% block="when A pressed on tile col $col row $row"
    //% col.min=0 col.max=15
    //% row.min=0 row.max=15
    //% group="Tile Interaction"
    export function onTilePressed(col: number, row: number, handler: TilePressHandler) {
        const key = `${col},${row}`;
        pressMap[key] = handler;
    }

    // ---------------------------------------------------------------------
    // Internal update loop – handles highlights and A‑press detection
    // ---------------------------------------------------------------------
    let loopInstalled = false;
    function ensureLoop() {
        if (loopInstalled) return;
        loopInstalled = true;
        // Highlight handling – runs each frame
        game.onUpdate(function () {
            for (const key of Object.keys(highlightMap)) {
                const rec = highlightMap[key];
                const [cStr, rStr] = key.split(",");
                const col = parseInt(cStr);
                const row = parseInt(rStr);
                const anyOnTile = isKindOnTile(rec.kind, col, row);
                const loc = tiles.getTileLocation(col, row);
                if (anyOnTile && !rec.active) {
                    tiles.setTileAt(loc, rec.highlight);
                    rec.active = true;
                } else if (!anyOnTile && rec.active) {
                    tiles.setTileAt(loc, rec.original);
                    rec.active = false;
                }
            }
        });
        // A‑press handling – fires when A is pressed and player is on a tile
        controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
            const players = sprites.allOfKind(SpriteKind.Player);
            if (players.length === 0) return;
            const playerLoc = players[0].tilemapLocation();
            const key = `${playerLoc.column},${playerLoc.row}`;
            const fn = pressMap[key];
            if (fn) fn(playerLoc);
        });
    }

    // Initialise when the file loads
    ensureLoop();
}
