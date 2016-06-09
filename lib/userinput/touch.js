"use strict";


var vector = require("../common/vector");
var Loop = require("../common/loop");


// returns center point between first and second touch point
function getCenterPosition(vector, boundingBox, firstTouch, secondTouch) {
    vector.x = 0.5 * (secondTouch.pageX - firstTouch.pageX) + firstTouch.pageX - boundingBox.left;
    vector.y = 0.5 * (secondTouch.pageY - firstTouch.pageY) + firstTouch.pageY - boundingBox.top;
    vector.z = 0;
    return vector;
}

// returns distance between to touch-points
function getLengthOfLine(firstTouch, secondTouch) {
    var x = secondTouch.pageX - firstTouch.pageX;
    var y = secondTouch.pageY - firstTouch.pageY;
    return Math.sqrt(x*x + y*y);
}


function touch($element, boundingBox, onStart, onInput, onEnd) {
    var currentTouches = 0;
    var currentPosition = vector.create();
    var previousPosition = vector.create();
    var inputVector = vector.create();

    var currentLength = 0;
    var previousLength = 0;


    var Processor = {

        currentEvent: null,

        start: function () {
            this.loopState = Loop.CONTINUE;
            Loop.add(this);
        },

        stop: function () {
            this.loopState = Loop.EXIT;
        },

        calculate: function () {
            var event = this.currentEvent;
            if (event == null) {
                return;
            }

            previousLength = currentLength;
            previousPosition.set(currentPosition);

            if (event.touches.length > 1) {
                currentLength = getLengthOfLine(event.touches[0], event.touches[1]);
                currentPosition = getCenterPosition(currentPosition, boundingBox, event.touches[0], event.touches[1]);

                inputVector.setDelta(currentPosition, previousPosition);
                // z = scale factor
                inputVector.z = previousLength === 0 ? 1 : currentLength / previousLength;

            } else {
                currentPosition.setValues(
                    event.touches[0].pageX - boundingBox.left,
                    event.touches[0].pageY - boundingBox.top,
                    0
                );
                inputVector.setDelta(currentPosition, previousPosition);
                inputVector.z = 1;
            }

            this.currentEvent = null;
            onInput(inputVector, currentPosition);
            return this.loopState;
        },

        render: Function.prototype
    };


    function startSingleTouch(touchItem) {
        currentLength = 0;
        previousLength = 0;
        currentPosition.setValues(touchItem.pageX - boundingBox.left, touchItem.pageY - boundingBox.top, 0);
        previousPosition.set(currentPosition);
    }

    function startDoubleTouch(firstTouch, secondTouch) {
        currentLength = getLengthOfLine(firstTouch, secondTouch);
        currentPosition = getCenterPosition(currentPosition, boundingBox, firstTouch, secondTouch);
        previousPosition.set(currentPosition);
    }

    function startTouch(event) {
        event.preventDefault();
        considerStart = false;
        currentTouches = event.touches.length;

        if (event.touches.length === 1) {
            startSingleTouch(event.touches[0]);

        } else {
            startDoubleTouch(event.touches[0], event.touches[1]);
        }

        Processor.start();
        onStart(currentPosition);
    }

    function endTouch(event) {
        // abort if inactive
        if (currentTouches === 0) {
            return;
        }

        // if touch remains, change mode
        if (event.touches.length === 1) {
            // reset
            startSingleTouch(event.touches[0]);
            onStart(currentPosition);
            return;
        }

        // else end input action
        considerStart = false;
        currentTouches = 0;
        Processor.stop();
        onEnd();
    }

    var considerStart = false;
    function considerInputStart(event) {
        considerStart = true;
    }

    // touchstart
    $element.addEventListener("touchstart", function (event) {
        if (event.touches.length > 2) {
            return;
        }

        if (event.touches.length === 1 && currentTouches === 0) {
            considerInputStart(event);

        } else {
            startTouch(event);
        }
    });

    // touchmove
    $element.addEventListener("touchmove", function (event) {
        if (currentTouches === 0 && considerStart === false) {
            return;

        } else if (considerStart === true) {
            startTouch(event);
        }

        event.preventDefault();
        event.stopPropagation();
        Processor.currentEvent = event;
    });

    // touchend
    $element.addEventListener("touchend", endTouch);

    document.body.addEventListener("touchend", endTouch);
}


module.exports = touch;
