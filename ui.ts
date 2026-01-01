
/**
 * Simple UI system for displaying HUD elements
 */
//% color="#d48c26" weight=70 icon="\uf2c2"
namespace ui {
    export enum Corner {
        //% block="Top Left"
        TopLeft = 0,
        //% block="Top Right"
        TopRight = 1,
        //% block="Bottom Left"
        BottomLeft = 2,
        //% block="Bottom Right"
        BottomRight = 3
    }

    // ---------------------------------------------------------------------
    // Observable values (Variable binding)
    // ---------------------------------------------------------------------

    export class ObservableValue {
        private _value: string;
        public onChange: events.Signal<string>;

        constructor(initialValue: string) {
            this._value = initialValue;
            this.onChange = new events.Signal<string>();
        }

        get value(): string {
            return this._value;
        }

        set value(v: string) {
            if (this._value !== v) {
                this._value = v;
                if (this.onChange.hasListeners()) {
                    this.onChange.dispatch(v);
                }
            }
        }
    }

    /**
     * Create a special variable that triggers code when it changes.
     */
    //% block="create observable value $initialValue"
    //% blockId=ui_create_observable
    //% group="Variables"
    export function createObservableValue(initialValue: string): ObservableValue {
        return new ObservableValue(initialValue);
    }

    /**
     * Run code when an observable value changes.
     */
    //% block="on $observable change to $v"
    //% observable.shadow=variables_get
    //% draggableParameters="reporter"
    //% group="Variables"
    export function onObservableChange(observable: ObservableValue, handler: (v: string) => void) {
        observable.onChange.add(handler);
    }

    /**
     * Set the value of an observable.
     */
    //% block="set $observable value to $v"
    //% observable.shadow=variables_get
    //% group="Variables"
    export function setObservable(observable: ObservableValue, v: string) {
        observable.value = v;
    }

    class UIItem {
        id: string;
        icon: Image;
        value: string;
        observable?: ObservableValue;
        bgColor: number;
        corner: Corner;
        color: number;

        constructor(id: string, icon: Image, value: string, corner: Corner, bgColor: number, color: number, observable?: ObservableValue) {
            this.id = id;
            this.icon = icon;
            this.value = value;
            this.observable = observable;
            this.bgColor = bgColor;
            this.corner = corner;
            this.color = color;
        }
    }

    const items: UIItem[] = [];
    let isRendering = false;
    const font = image.font8;
    const padding = 2;
    const spacing = 4; // Space between items

    /**
     * Add a UI element to the screen. Returns an ID to update it later.
     */
    //% block="add UI item $icon value $value at $corner || bg $bgColor text $color"
    //% icon.shadow=screen_image_picker
    //% value.defl="0"
    //% bgColor.shadow=colorindexpicker
    //% bgColor.defl=15
    //% color.shadow=colorindexpicker
    //% color.defl=1
    //% group="HUD"
    export function add(icon: Image, value: string, corner: Corner, bgColor: number = 15, color: number = 1): string {
        const id = Math.randomRange(0, 999999).toString();
        const item = new UIItem(id, icon, value, corner, bgColor, color);
        items.push(item);
        startRenderLoop();
        return id;
    }

    /**
     * Add a UI element that automatically updates when the observable value changes.
     */
    //% block="add live UI item $icon bound to $observable at $corner || bg $bgColor text $color"
    //% icon.shadow=screen_image_picker
    //% observable.shadow=variables_get
    //% bgColor.shadow=colorindexpicker
    //% bgColor.defl=15
    //% color.shadow=colorindexpicker
    //% color.defl=1
    //% group="HUD"
    export function addLive(icon: Image, observable: ObservableValue, corner: Corner, bgColor: number = 15, color: number = 1) {
        const id = Math.randomRange(0, 999999).toString();
        const item = new UIItem(id, icon, observable.value, corner, bgColor, color, observable);

        // Auto-update
        observable.onChange.add((v) => {
            item.value = v;
        });

        items.push(item);
        startRenderLoop();
    }

    /**
     * Update the value of a UI element
     */
    //% block="update UI item $id to $value"
    //% id.shadow=variables_get
    //% id.defl=myID
    //% group="HUD"
    export function updateValue(id: string, value: string) {
        for (const item of items) {
            if (item.id === id) {
                // If it's bound to an observable, updating it manually might be overwritten,
                // but we allow it.
                item.value = value;
                return;
            }
        }
    }

    function startRenderLoop() {
        if (isRendering) return;
        isRendering = true;

        scene.createRenderable(90, function (target: Image, camera: scene.Camera) {
            // Group indices to track offsets
            let tlX = 2;
            let trX = 158;
            let blX = 2;
            let brX = 158;

            const tlY = 2;
            const trY = 2;
            const blY = 110; // Approx bottom
            const brY = 110;

            for (const item of items) {
                // Calculate dimensions
                const textWidth = item.value.length * font.charWidth;
                const totalWidth = item.icon.width + textWidth + (padding * 3);
                const height = Math.max(item.icon.height, font.charHeight) + (padding * 2);

                let x = 0;
                let y = 0;

                // Determine position based on corner
                if (item.corner === Corner.TopLeft) {
                    x = tlX;
                    y = tlY;
                    tlX += totalWidth + spacing;
                } else if (item.corner === Corner.TopRight) {
                    x = trX - totalWidth;
                    y = trY;
                    trX -= (totalWidth + spacing);
                } else if (item.corner === Corner.BottomLeft) {
                    x = blX;
                    y = blY - height; // Align bottom edge
                    blX += totalWidth + spacing;
                } else if (item.corner === Corner.BottomRight) {
                    x = brX - totalWidth;
                    y = brY - height;
                    brX -= (totalWidth + spacing);
                }

                // Draw Background
                if (item.bgColor) {
                    target.fillRect(x, y, totalWidth, height, item.bgColor);
                    // Optional border? 
                    // target.drawRect(x, y, totalWidth, height, item.color);
                }

                // Draw Icon
                target.drawTransparentImage(item.icon, x + padding, y + padding + (height - item.icon.height - padding * 2) / 2);

                // Draw Text
                target.print(item.value, x + item.icon.width + (padding * 2), y + padding + (height - font.charHeight - padding * 2) / 2 + 1, item.color, font);
            }
        });
    }
}
