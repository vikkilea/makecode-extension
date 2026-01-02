
/**
 * Observable values that can be watched for changes.
 */
//% color="#E63022" weight=80 icon="\uf1ec"
namespace observables {

    export class ObservableValue {
        private _value: any;
        public onChange: events.Signal<any>;

        constructor(initialValue: any) {
            this._value = initialValue;
            this.onChange = new events.Signal<any>();
        }

        get value(): any {
            return this._value;
        }

        set value(v: any) {
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
    //% block="create observable string $initialValue"
    //% blockId=observables_create_string
    //% group="Construction"
    export function createObservableString(initialValue: string): ObservableValue {
        return new ObservableValue(initialValue);
    }

    /**
     * Create a special variable that triggers code when it changes.
     */
    //% block="create observable number $initialValue"
    //% initialValue.defl=0
    //% blockId=observables_create_number
    //% group="Construction"
    export function createObservableNumber(initialValue: number): ObservableValue {
        return new ObservableValue(initialValue);
    }

    /**
     * Run code when an observable value changes.
     */
    //% block="on $observable change to $v"
    //% observable.shadow=variables_get
    //% draggableParameters="reporter"
    //% group="Events"
    export function onObservableChange(observable: ObservableValue, handler: (v: any) => void) {
        observable.onChange.add(handler);
    }

    /**
     * Set the string value of an observable.
     */
    //% block="set $observable string value to $v"
    //% observable.shadow=variables_get
    //% v.defl=""
    //% group="Values"
    export function setObservableString(observable: ObservableValue, v: string) {
        observable.value = v;
    }

    /**
     * Set the number value of an observable.
     */
    //% block="set $observable number value to $v"
    //% observable.shadow=variables_get
    //% v.defl=0
    //% group="Values"
    export function setObservableNumber(observable: ObservableValue, v: number) {
        observable.value = v;
    }

    /**
     * Change the value of an observable number by an amount.
     */
    //% block="change $observable by $amount"
    //% observable.shadow=variables_get
    //% amount.defl=1
    //% group="Values"
    export function changeObservableValueBy(observable: ObservableValue, amount: number) {
        if (typeof observable.value === "number") {
            observable.value = (observable.value as number) + amount;
        }
    }

    /**
     * Get the current value of an observable as a number.
     */
    //% block="get number value of $observable"
    //% observable.shadow=variables_get
    //% group="Values"
    export function getObservableNumber(observable: ObservableValue): number {
        return parseFloat("" + observable.value);
    }

    /**
     * Get the current value of an observable as a string.
     */
    //% block="get string value of $observable"
    //% observable.shadow=variables_get
    //% group="Values"
    export function getObservableString(observable: ObservableValue): string {
        return "" + observable.value;
    }
}
