
/**
 * A lightweight Event/Observer system for decoupling logic.
 */
//% color="#d48c26" weight=20 icon="\uf0e0"
namespace events {
    export type Handler<T> = (arg: T) => void;

    /**
     * A generic signal that subscribers can listen to.
     */
    export class Signal<T> {
        private listeners: Handler<T>[];

        constructor() {
            this.listeners = [];
        }

        /**
         * Subscribe to this signal.
         */
        public add(handler: Handler<T>): void {
            if (this.listeners.indexOf(handler) < 0) {
                this.listeners.push(handler);
            }
        }

        /**
         * Unsubscribe from this signal.
         */
        public remove(handler: Handler<T>): void {
            const index = this.listeners.indexOf(handler);
            if (index >= 0) {
                this.listeners.splice(index, 1);
            }
        }

        /**
         * Dispatch an event to all subscribers.
         */
        public dispatch(arg: T): void {
            // Clone to avoid issues if listeners remove themselves during dispatch
            const list = this.listeners;
            for (const handler of list) {
                handler(arg);
            }
        }

        /**
         * Check if there are any listeners
         */
        public hasListeners(): boolean {
            return this.listeners.length > 0;
        }
    }
}
