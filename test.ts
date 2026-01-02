// Tests go here; this will not be compiled when this package is used as an extension.

// Test 1: Observables
// Verify creating, setting, and getting observable values works
{
    const obsString = observables.createObservableString("Initial");
    if (observables.getObservableString(obsString) !== "Initial") console.log("Test 1A Failed: Initial string value mismatch");

    observables.setObservableString(obsString, "Updated");
    if (observables.getObservableString(obsString) !== "Updated") console.log("Test 1B Failed: Updated string value mismatch");

    const obsNum = observables.createObservableNumber(10);
    if (observables.getObservableNumber(obsNum) !== 10) console.log("Test 1C Failed: Initial number value mismatch");

    observables.changeObservableValueBy(obsNum, 5);
    if (observables.getObservableNumber(obsNum) !== 15) console.log("Test 1D Failed: Changed number value mismatch");

    console.log("Observables test complete.");
}

// Test 2: Event Signals
// Verify signals dispatch to listeners
{
    const signal = new events.Signal<string>();
    let received = "";

    signal.add((msg: string) => {
        received = msg;
    });

    signal.dispatch("Hello");

    if (received !== "Hello") console.log("Test 2A Failed: Signal did not dispatch correctly");

    console.log("Events test complete.");
}

// Test 3: Observable Events
// Verify that observables trigger change events
{
    const obs = observables.createObservableNumber(0);
    let changeValue = 0;

    observables.onObservableChange(obs, (v: any) => {
        changeValue = v;
    });

    observables.setObservableNumber(obs, 42);

    if (changeValue !== 42) console.log("Test 3A Failed: Observable change event not fired");

    console.log("Observable Events test complete.");
}
