//% color="#d48c26" weight=90 icon="\uf279"
namespace tiles {
    export class TilePoint {
        col: number;
        row: number;
        constructor(col: number, row: number) {
            this.col = col;
            this.row = row;
        }
    }

    /**
     * Create a reusable tile point coordinate
     */
    //% block="tile point col $col row $row"
    //% blockId=tiles_create_tile_point
    //% group="Locations"
    //% weight=100
    export function createTilePoint(col: number, row: number): TilePoint {
        return new TilePoint(col, row);
    }

    // ---------------------------------------------------------------------
    // Movement helpers
    // ---------------------------------------------------------------------
    /**
     * Move a sprite to a specific tile location at a given speed.
     * Straight‑line movement; no path‑finding.
     */
    //% block="move $sprite to $pt at speed $speed"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% pt.shadow=tiles_create_tile_point
    //% group="Movement"
    export function moveSpriteToTile(sprite: Sprite, pt: TilePoint, speed: number) {
        const col = pt.col;
        const row = pt.row;
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
    //% block="teleport $sprite to $pt"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% pt.shadow=tiles_create_tile_point
    //% group="Movement"
    export function teleportToTile(sprite: Sprite, pt: TilePoint) {
        const col = pt.col;
        const row = pt.row;
        const tileSize = 16;
        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;
        sprite.setPosition(x, y);
    }

    // ---------------------------------------------------------------------
    // Tile interaction API (highlight & press logic)
    // ---------------------------------------------------------------------

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

    /**
     * Register a tile to change its sprite when a sprite of the given kind touches it.
     * The tile at the point will show `highlight` while any sprite of that kind is on it.
     */
    //% block="highlight tile at $pt when kind $kind touches it with $highlight"
    //% kind.shadow=spritekind
    //% highlight.shadow=tileset_tile_picker
    //% pt.shadow=tiles_create_tile_point
    //% group="Tile Interaction"
    export function setTileHighlight(pt: TilePoint, kind: number, highlight: Image) {
        const col = pt.col;
        const row = pt.row;
        const key = `${col},${row}`;
        const loc = tiles.getTileLocation(col, row);
        const original = tiles.getTileImage(loc);
        highlightMap[key] = { kind, original, highlight, active: false };
    }

    /**
     * Check if any sprite of the given kind is currently on the tile at the point.
     */
    //% block="is kind $kind on tile $pt"
    //% kind.shadow=spritekind
    //% pt.shadow=tiles_create_tile_point
    //% group="Tile Interaction"
    export function isKindOnTile(kind: number, pt: TilePoint): boolean {
        const col = pt.col;
        const row = pt.row;
        const spritesOfKind = sprites.allOfKind(kind);
        const targetLoc = tiles.getTileLocation(col, row);
        for (const s of spritesOfKind) {
            const loc = s.tilemapLocation();
            if (loc.column === targetLoc.column && loc.row === targetLoc.row) {
                return true;
            }
        }
        return false;
    }

    // ---------------------------------------------------------------------
    // Internal update loop
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

                // Check using tmp point
                const pt = new TilePoint(col, row);
                const anyOnTile = isKindOnTile(rec.kind, pt);

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
    }

    // Initialise when the file loads
    ensureLoop();
}
