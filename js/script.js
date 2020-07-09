var controller = new Leap.Controller({
    enableGestures: true,
    frameEventName: "animationFrame",
  });

  var seqLength = 4;
  var recording = false;
  var authenticating = false;
  var allowed = false;
  var seq = [];
  
  class State {
    constructor(roll, pitch, pinch){
      this.roll = roll;
      this.pitch = pitch;
      this.pinch = pinch;
    }
  }

  var state = new State(0, 0, 0);
  var prevState = new State(0, 0, 0);
  var thresholds = new State(0.5, 0.7, 0.5);
  var data = new State(0, 0, 0);

  function startRecording() {
    recording = true;
    seq = [];
  }

  function authenticate() {
    authenticating = true;
  }

  controller.on("frame", function (frame) {
    frame.hands.forEach(function (hand) {
      if (hand.type == 'right') {
        data.roll = hand.roll();
        data.pitch = hand.pitch();
        data.pinch = hand.pinchStrength;
      }
    });
  });

  function calculateState() {
    if (data.roll > thresholds.roll){
      state.roll = 1;
    } else if (data.roll < -thresholds.roll){
      state.roll = -1;
    } else if (data.pitch > thresholds.pitch){
      state.pitch = 1;
    } else if (data.pitch < -thresholds.pitch){
      state.pitch = -1;
    } else if (data.pinch > thresholds.pinch){
      state.pinch = 1;
    }
  }
  
  function resetState() {
    state.roll = 0;
    state.pitch = 0;
    state.pinch = 0;
  }

  function stateChanged() {
    if (prevState.roll != state.roll || 
        prevState.pitch != state.pitch || 
        prevState.pinch != state.pinch) {
          return true;
    } else return false;
  }

  function stateNonZero() {
    if (!state.roll && !state.pitch && !state.pinch) {
      return false;
    } else return true;
  }

  function newGesture() {
    return stateChanged() && stateNonZero();
  }

  function compareStates(target, candidate) {
    return target.roll == candidate.roll && 
            target.pitch == candidate.pitch && 
            target.pinch == candidate.pinch;
  }

  setInterval(() => {
    calculateState();
    if (recording && newGesture()) {
      var curr = new State(state.roll, state.pitch, state.pinch);
      seq.push(curr);
      document.getElementById('status').innerText = "Recorded gesture #" + seq.length;
      if (seq.length == seqLength) {
        recording = false;
      }
    } else if (authenticating && seq.length > 0 && newGesture()) {
      var candidate = seq[0];
      if (compareStates(state, candidate)){
        console.log('correct');
        seq.shift();
        if (!seq.length) {
          allowed = true;
          document.getElementById('status').innerText = "$$$ Access granted $$$";
          authenticating = false;
        }
      } else {
        document.getElementById('status').innerText = "XXX Access denied XXX";
        seq = [];
      }
    }
    prevState.roll = state.roll;
    prevState.pitch = state.pitch;
    prevState.pinch = state.pinch;
    resetState();
  }, 100);
  controller.connect();