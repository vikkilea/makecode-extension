
/**
 * Advanced animation and sprite handling
 */
//% color="#d48c26" weight=80 icon="\uf03e"
namespace character {
    const ANIM_KEY = "char_anim_data";

    enum Facing {
        North = 0,
        NorthEast = 1,
        East = 2,
        SouthEast = 3,
        South = 4,
        SouthWest = 5,
        West = 6,
        NorthWest = 7,
        Idle = 8
    }

    class AnimSet {
        // Cached images for single-frame 'animations'
        images: Image[];
        // Cached animation objects for multi-frame
        // We store the generic animation definitions here if supported, 
        // but MakeCode arcade native animation is often simple arrays.
        // We will support simple Image[] (animation frames) for each direction.
        anims: Image[][];
        interval: number;

        constructor() {
            this.images = [];
            this.anims = [];
            this.interval = 100;
        }
    }

    /**
     * Setup a character with 5 basic sprites for directions.
     * Allows for automatic flipping for E, NE, SE.
     * S falls back to SW.
     * Supports single images.
     */
    //% block="set character $sprite sprites: idle $idle N $n W $w SW $sw NW $nw"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% idle.shadow=screen_image_picker
    //% n.shadow=screen_image_picker
    //% w.shadow=screen_image_picker
    //% sw.shadow=screen_image_picker
    //% nw.shadow=screen_image_picker
    //% group="Setup"
    export function setCharacterImages(sprite: Sprite, idle: Image, n: Image, w: Image, sw: Image, nw: Image) {
        initCharacter(sprite, [idle], [n], [w], [sw], [nw], 0);
    }

    /**
     * Setup a character with 5 animation loops for directions.
     */
    //% block="set character $sprite anims: idle $idle N $n W $w SW $sw NW $nw interval $interval ms"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% idle.shadow=animation_editor
    //% n.shadow=animation_editor
    //% w.shadow=animation_editor
    //% sw.shadow=animation_editor
    //% nw.shadow=animation_editor
    //% interval.defl=100
    //% group="Setup"
    export function setCharacterAnims(sprite: Sprite, idle: Image[], n: Image[], w: Image[], sw: Image[], nw: Image[], interval: number) {
        initCharacter(sprite, idle, n, w, sw, nw, interval);
    }

    function initCharacter(sprite: Sprite, idle: Image[], n: Image[], w: Image[], sw: Image[], nw: Image[], interval: number) {
        const set = new AnimSet();
        set.interval = interval;

        // Map inputs to 8 directions
        // 0: N, 1: NE, 2: E, 3: SE, 4: S, 5: SW, 6: W, 7: NW

        // Helper to flip an animation array
        const flip = (frames: Image[]) => frames.map(img => {
            const c = img.clone();
            c.flipX();
            return c;
        });

        const north = n;
        const northWest = nw;
        const west = w;
        const southWest = sw;

        // Mirrored
        const northEast = flip(northWest);
        const east = flip(west);
        const southEast = flip(southWest);

        // Fallbacks
        const south = southWest; // Using SW for South as per constraint

        set.anims[Facing.North] = north;
        set.anims[Facing.NorthEast] = northEast;
        set.anims[Facing.East] = east;
        set.anims[Facing.SouthEast] = southEast;
        set.anims[Facing.South] = south;
        set.anims[Facing.SouthWest] = southWest;
        set.anims[Facing.West] = west;
        set.anims[Facing.NorthWest] = northWest;
        set.anims[Facing.Idle] = idle;

        sprites.setDataSprite(sprite, ANIM_KEY, set as any);

        // Register sprite for updates if not already registered
        let registered: Sprite[] = sprites.readDataSprite(game.currentScene(), "char_anim_registry") as any;
        if (!registered) {
            registered = [];
            sprites.setDataSprite(game.currentScene(), "char_anim_registry", registered as any);

            // Start the loop only once
            game.onUpdate(function () {
                const reg: Sprite[] = sprites.readDataSprite(game.currentScene(), "char_anim_registry") as any;
                if (!reg) return;

                // Cleanup destroyed sprites lazily
                for (let i = reg.length - 1; i >= 0; i--) {
                    if (reg[i].flags & sprites.Flag.Destroyed) {
                        reg.splice(i, 1);
                    }
                }

                for (const sprite of reg) {
                    const animSet = sprites.readDataSprite(sprite, ANIM_KEY) as any as AnimSet;
                    if (!animSet) continue;

                    const vx = sprite.vx;
                    const vy = sprite.vy;

                    let facing = Facing.Idle;

                    // If moving directly, prefer 4-way or 8-way?
                    // The user specified 8 directions effectively (N, W, SW, NW and mirrors)
                    if (Math.abs(vx) > 5 || Math.abs(vy) > 5) {
                        const angle = Math.atan2(vy, vx) * 180 / Math.PI;

                        if (angle > -22.5 && angle <= 22.5) facing = Facing.East;
                        else if (angle > 22.5 && angle <= 67.5) facing = Facing.SouthEast;
                        else if (angle > 67.5 && angle <= 112.5) facing = Facing.South;
                        else if (angle > 112.5 && angle <= 157.5) facing = Facing.SouthWest;
                        else if (angle > 157.5 || angle <= -157.5) facing = Facing.West;
                        else if (angle > -157.5 && angle <= -112.5) facing = Facing.NorthWest;
                        else if (angle > -112.5 && angle <= -67.5) facing = Facing.North;
                        else if (angle > -67.5 && angle <= -22.5) facing = Facing.NorthEast;
                    }

                    const frames = animSet.anims[facing];
                    if (frames && frames.length > 0) {
                        if (frames.length === 1) {
                            sprite.setImage(frames[0]);
                        } else {
                            const index = Math.floor(game.runtime() / animSet.interval) % frames.length;
                            sprite.setImage(frames[index]);
                        }
                    }
                }
            });
        }

        if (registered.indexOf(sprite) < 0) {
            registered.push(sprite);
        }
    }

    /**
     * Manually flip a sprite horizontally
     */
    //% block="flip $sprite horizontally"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Utilities"
    export function flipSprite(sprite: Sprite) {
        sprite.image.flipX();
    }
}
