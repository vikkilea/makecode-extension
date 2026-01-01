
/**
 * specific state handling for entities
 */
//% color="#d48c26" weight=100 icon="\uf085"
namespace behaviors {
    const STATE_KEY = "behaviours_state";
    const LAST_STATE_KEY = "behaviours_last_state";

    interface BehaviorDef {
        kind: number;
        state: string;
        update: events.Signal<Sprite>;
        enter: events.Signal<Sprite>;
        exit: events.Signal<Sprite>;
    }

    const behaviors: BehaviorDef[] = [];
    const registeredKinds: number[] = [];

    /**
     * Set the state of a sprite. Triggers exit of old state and enter of new state.
     */
    //% block="set state of $sprite to $state"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="State Management"
    export function setState(sprite: Sprite, state: string) {
        const oldState = sprites.readDataString(sprite, STATE_KEY);

        if (oldState === state) return;

        // Trigger Exit
        if (oldState) {
            trigger(sprite, oldState, "exit");
        }

        // Update State
        sprites.setDataString(sprite, STATE_KEY, state);

        // Trigger Enter
        trigger(sprite, state, "enter");
    }

    /**
     * Get the current state of a sprite
     */
    //% block="get state of $sprite"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="State Management"
    export function getState(sprite: Sprite): string {
        return sprites.readDataString(sprite, STATE_KEY);
    }

    /**
     * Run code when a sprite of a certain kind enters a state
     */
    //% block="on kind $kind enter state $state with $sprite"
    //% kind.shadow=spritekind
    //% draggableParameters="reporter"
    //% group="Transitions"
    export function onEnter(kind: number, state: string, handler: (sprite: Sprite) => void) {
        register(kind, state, "enter", handler);
    }

    /**
     * Run code every frame while a sprite is in a state
     */
    //% block="on kind $kind update state $state with $sprite"
    //% kind.shadow=spritekind
    //% draggableParameters="reporter"
    //% group="Events"
    export function onUpdate(kind: number, state: string, handler: (sprite: Sprite) => void) {
        register(kind, state, "update", handler);
    }

    /**
     * Run code when a sprite leaves a state
     */
    //% block="on kind $kind exit state $state with $sprite"
    //% kind.shadow=spritekind
    //% draggableParameters="reporter"
    //% group="Transitions"
    export function onExit(kind: number, state: string, handler: (sprite: Sprite) => void) {
        register(kind, state, "exit", handler);
    }

    function getBehavior(kind: number, state: string): BehaviorDef | null {
        for (const behavior of behaviors) {
            if (behavior.kind === kind && behavior.state === state) {
                return behavior;
            }
        }
        return null;
    }

    function register(kind: number, state: string, type: "enter" | "update" | "exit", handler: (sprite: Sprite) => void) {
        let def = getBehavior(kind, state);
        if (!def) {
            def = {
                kind,
                state,
                enter: new events.Signal<Sprite>(),
                update: new events.Signal<Sprite>(),
                exit: new events.Signal<Sprite>()
            };
            behaviors.push(def);
        }

        def[type].add(handler);

        if (registeredKinds.indexOf(kind) < 0) {
            registeredKinds.push(kind);
        }
    }

    function trigger(sprite: Sprite, state: string, type: "enter" | "exit") {
        const def = getBehavior(sprite.kind(), state);
        if (def) {
            const signal = type === "enter" ? def.enter : def.exit;
            if (signal.hasListeners()) {
                signal.dispatch(sprite);
            }
        }
    }

    // Main Loop
    game.onUpdate(function () {
        for (const kind of registeredKinds) {
            const spritesOfKind = sprites.allOfKind(kind);
            for (const sprite of spritesOfKind) {
                const currentState = getState(sprite);
                if (!currentState) continue;

                const def = getBehavior(kind, currentState);
                if (def && def.update.hasListeners()) {
                    def.update.dispatch(sprite);
                }
            }
        }
    });
}
