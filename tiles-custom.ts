
/**
 * Utilities for tilemap interactions
 */
//% color="#d48c26" weight=90 icon="\uf279"
namespace tiles {
    /**
     * Move a sprite to a specific tile location at a given speed.
     * This moves in a straight line (does not pathfind around walls).
     */
    //% block="move $sprite to tile col $col row $row at speed $speed"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Movement"
    export function moveSpriteToTile(sprite: Sprite, col: number, row: number, speed: number) {
        const targetX = col * 16 + 8;
        const targetY = row * 16 + 8;

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

        // Simple behavior to stop when close
        // We register a one-time update handler for this movement
        let moveHandler = () => {
            const currDx = targetX - sprite.x;
            const currDy = targetY - sprite.y;
            const currDist = Math.sqrt(currDx * currDx + currDy * currDy);

            if (currDist < speed / 30 || ((currDx > 0 ? 1 : -1) != (dx > 0 ? 1 : -1) && (currDy > 0 ? 1 : -1) != (dy > 0 ? 1 : -1))) {
                sprite.setVelocity(0, 0);
                sprite.setPosition(targetX, targetY);
                game.removeScenePushHandler(moveHandler);
            }
        };
        game.addScenePushHandler(moveHandler);
    }

    /**
     * Teleport a sprite directly to a tile
     */
    //% block="teleport $sprite to tile col $col row $row"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Movement"
    export function teleportToTile(sprite: Sprite, col: number, row: number) {
        tiles.placeOnTile(sprite, tiles.getTileLocation(col, row));
    }
}
