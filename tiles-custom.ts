//% color="#d48c26" weight=90 icon="\uf279"
namespace tiles {
    // ---------------------------------------------------------------------
    // Movement helpers
    // ---------------------------------------------------------------------

    interface MoveState {
        sprite: Sprite;
        targetX: number;
        targetY: number;
        speed: number;
        prevDist: number;
    }

    const activeMovers: MoveState[] = [];
    let moveLoopStarted = false;

    function ensureMoveLoop() {
        if (moveLoopStarted) return;
        moveLoopStarted = true;
        game.onUpdate(() => {
            for (let i = activeMovers.length - 1; i >= 0; i--) {
                const mover = activeMovers[i];
                const s = mover.sprite;

                // If sprite destroyed, remove from movers
                if (s.flags & sprites.Flag.Destroyed) {
                    activeMovers.splice(i, 1);
                    continue;
                }

                const dx = mover.targetX - s.x;
                const dy = mover.targetY - s.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Stop conditions:
                // 1. We are very close (less than 2px)
                // 2. We moved further away than last frame (overshoot)
                if (dist < 2 || dist > mover.prevDist) {
                    s.setVelocity(0, 0);
                    s.setPosition(mover.targetX, mover.targetY);
                    activeMovers.splice(i, 1);
                } else {
                    mover.prevDist = dist;
                    // Re-assert velocity in case something else changed it 
                    // or if physics needs a nudge, though usually setVelocity once is enough. 
                    // However, calculating exact frame movement is better.
                    const ratio = mover.speed / dist;
                    s.setVelocity(dx * ratio, dy * ratio);
                }
            }
        });
    }

    /**
     * Move a sprite to a specific tile location at a given speed.
     * Straight‑line movement; no path‑finding.
     */
    //% block="move $sprite to $location at speed $speed"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% location.shadow=mapgettile
    //% group="Movement"
    export function moveSpriteToTile(sprite: Sprite, location: tiles.Location, speed: number) {
        const col = location.col;
        const row = location.row;
        const tileSize = 16;
        const targetX = col * tileSize + tileSize / 2;
        const targetY = row * tileSize + tileSize / 2;

        const dx = targetX - sprite.x;
        const dy = targetY - sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Remove any existing mover for this sprite
        for (let i = activeMovers.length - 1; i >= 0; i--) {
            if (activeMovers[i].sprite === sprite) {
                activeMovers.splice(i, 1);
            }
        }

        if (dist < 2) {
            sprite.setVelocity(0, 0);
            sprite.setPosition(targetX, targetY);
            return;
        }

        activeMovers.push({
            sprite: sprite,
            targetX: targetX,
            targetY: targetY,
            speed: speed,
            prevDist: dist + 1 // Ensure we don't trigger overshoot on first frame
        });

        // Set initial velocity
        const ratio = speed / dist;
        sprite.setVelocity(dx * ratio, dy * ratio);

        ensureMoveLoop();
    }

    /**
     * Teleport a sprite directly to a tile.
     */
    //% block="teleport $sprite to $location"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% location.shadow=mapgettile
    //% group="Movement"
    export function teleportToTile(sprite: Sprite, location: tiles.Location) {
        const col = location.col;
        const row = location.row;
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
    //% block="highlight tile at $location when kind $kind touches it with $highlight"
    //% kind.shadow=spritekind
    //% highlight.shadow=tileset_tile_picker
    //% location.shadow=mapgettile
    //% group="Tile Interaction"
    export function setTileHighlight(location: tiles.Location, kind: number, highlight: Image) {
        const col = location.col;
        const row = location.row;
        const key = `${col},${row}`;
        const loc = tiles.getTileLocation(col, row);
        const original = tiles.getTileImage(loc);
        highlightMap[key] = { kind, original, highlight, active: false };
    }

    /**
     * Check if any sprite of the given kind is currently on the tile at the point.
     */
    //% block="is kind $kind on tile $location"
    //% kind.shadow=spritekind
    //% location.shadow=mapgettile
    //% group="Tile Interaction"
    export function isKindOnTile(kind: number, location: tiles.Location): boolean {
        const col = location.col;
        const row = location.row;
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
                const loc = tiles.getTileLocation(col, row);
                const anyOnTile = isKindOnTile(rec.kind, loc);

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
