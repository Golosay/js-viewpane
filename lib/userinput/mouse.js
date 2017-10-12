"use strict";


var Timeout = require("../common/Timeout");
var vector = require("../common/vector");

var mouseWheelRange = 1000;
var mouseWheelDelay = 50;

function mouse($element, boundingBox, onStart, onInput, onEnd) {
    var config = {
        activated: true,
        dispose: function () {
            this.activated = false;
            $element.removeEventListener("mousedown", mousedown);
            $element.removeEventListener("mousemove", mousemove);
            $element.removeEventListener("mouseup", mouseup);
            $element.removeEventListener("mousewheel", mousewheel);
            $element.removeEventListener("wheel", wheel);
            document.body.removeEventListener("mousemove", cancelInput); // mouse left container
            document.body.removeEventListener("mouseout", mouseout); // mouse left window
        }
    };

    var isInAction = false;
    var previousPosition = vector.create();
    var currentPosition = vector.create();
    var inputVector = vector.create();

    $element.addEventListener("mousedown", mousedown);
    $element.addEventListener("mousemove", mousemove);
    $element.addEventListener("mouseup", mouseup);
    $element.addEventListener("mousewheel", mousewheel);
    $element.addEventListener("wheel", wheel);
    document.body.addEventListener("mousemove", cancelInput); // mouse left container
    document.body.addEventListener("mouseout", mouseout); // mouse left window

    function mousedown(event) {
        if (isInAction === true) {
            return;
        }

        isInAction = true;

        if (config.activated === false) {
            return;
        }

        var x = event.pageX - boundingBox.left;
        var y = event.pageY - boundingBox.top;

        event.preventDefault();

        currentPosition.setValues(x, y, currentPosition.z);
        onStart(currentPosition);
    }

    function mousemove(event) {
        if (isInAction === false || config.activated === false) {
            return;
        }

        var x = event.pageX - boundingBox.left;
        var y = event.pageY - boundingBox.top;

        event.preventDefault();
        event.stopPropagation(); // stop event to bubble to document.body, which aborts dragging

        previousPosition.set(currentPosition);
        currentPosition.setValues(x, y, currentPosition.z);
        inputVector.setDelta(currentPosition, previousPosition);
        // convert position to scale
        inputVector.z = 1;

        onInput(inputVector, currentPosition);
    }

    function mouseup(event) {
        if (isInAction === false) {
            return;
        }

        isInAction = false;
        onEnd(event);
    }

    var wheelTimeout = new Timeout(function () {
        if (isInAction === false) {
            return;
        }

        isInAction = false;
        onEnd();
    }, mouseWheelDelay);

    function mousewheel(event) {
        if (config.activated === false) {
            return;
        }

        event.preventDefault();

        var x = event.pageX - boundingBox.left;
        var y = event.pageY - boundingBox.top;
        var z = event.wheelDelta;

        if (isInAction === false) {
            isInAction = true;

            wheelTimeout.start();
            currentPosition.set(x, y, z);
            onStart(currentPosition);

        } else {

            wheelTimeout.keepAlive();
            previousPosition.set(currentPosition);
            currentPosition.set(x, y, currentPosition.z + z);
            inputVector.setDelta(currentPosition, previousPosition);
            // convert position to scale
            inputVector.z = 1 + inputVector.z / mouseWheelRange;
            onInput(inputVector, currentPosition);
        }
    }

    function wheel(event) {
        if (config.activated === false) {
            return;
        }

        event.preventDefault();

        var x = event.pageX - boundingBox.left;
        var y = event.pageY - boundingBox.top;
        var z = Math.abs(event.deltaY) > 10 ? event.deltaY : event.deltaY * 20;

        // ! need offset x, inconsistent across browser. any chance to derive position without bounding box?

        if (isInAction === false) {
            isInAction = true;

            wheelTimeout.start();
            currentPosition.setValues(x, y, z);
            onStart(currentPosition);

        } else {

            wheelTimeout.keepAlive();
            previousPosition.set(currentPosition);
            currentPosition.setValues(x, y, currentPosition.z + z);
            inputVector.setDelta(currentPosition, previousPosition);
            // convert position to scale
            inputVector.z = 1 + inputVector.z / mouseWheelRange;
            onInput(inputVector, currentPosition);
        }
    }

    function cancelInput(event) {
        if (isInAction === false) {
            return;
        }

        isInAction = false;
        onEnd(event);
    }

    function mouseout(event) {
        event = event ? event : window.event;
        var from = event.relatedTarget || event.toElement;
        if (!from || from.nodeName === "HTML") {
            cancelInput(event);
        }
    }

    return config;
}


module.exports = mouse;

