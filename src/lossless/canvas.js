import {
    Public
} from "./lib/backend";

export default class Canvas {
    constructor(canvas, brushSize, defaultColor = "black", options) {
        this.canvas = canvas;
        if (typeof options == "undefined") {
            throw new Error("Canvas requires options object in lossless mode.")
        }
        if (!options.accuracy) {
            throw new Error("Canvas options require property accuracy in lossless mode.")
        }

        if (options.accuracy % 1 !== 0) {
            throw new Error("Canvas accuracy cannot be a decimal.")
        }

        if (!Number.isFinite(options.accuracy)) {
            throw new Error("Canvas accuracy must be an integer.")
        }

        this.accuracy = Math.min(20, options.accuracy)
        this.object = new Public(canvas, 5, defaultColor, 1, this.accuracy);
        this.isDrawing = false;
        this.lastX = null;
        this.lastY = null;
        this.setColor(defaultColor)
        this.listen();
        this.export = this.out;
        this.object.wipe();
        
    }

    setBrushSize(size) {
        this.object.setSize(size);
        return size;
    }

    setColor(color) {
        this.object.setColor(color);
        return color;
    }

    clear() {
        this.object.wipe();
        this.lastX = null;
        this.lastY = null;
    }

    exportAs(dataType) {
        if (typeof dataType == "undefined") {
            throw new Error("Datatype is a required parameter for exportAs.")
        }
        const type = dataType.trim().toLowerCase();
        switch (type) {
            case 'base64':
                return this.object.toBase64()
                break
            case 'binary':
                return this.object.getBinary();
                break
            case 'log':
            case 'raw':
            case 'text':
                return this.object.getLog();
                break
            default:
                return this.object.getLog();
                break
        }
    }

    out(dataType = 'base64') {
        const type = dataType.trim().toLowerCase();
        switch (type) {
            case 'base64':
                return this.object.toBase64()
                break
            case 'binary':
                return this.object.getBinary();
                break
            case 'log':
            case 'raw':
            case 'text':
                return this.object.getLog();
                break
            default:
                return this.object.getLog();
                break
        }
    }

    listen() {
        // Mouse version
        this.canvas.addEventListener('mousedown', ((e) => {
            this.isDrawing = true;
            this.object.resetLogPoint();
            const rect = this.canvas.getBoundingClientRect();
            this.lastX = e.clientX - rect.left;
            this.lastY = e.clientY - rect.top;
            this.object.drawCircle(this.object.brushSize, this.lastX, this.lastY);
            this.object.draw();
        }).bind(this));

        document.addEventListener('mouseup', (() => {
            this.isDrawing = false;
            this.lastX = null;
            this.lastY = null;
        }).bind(this));

        document.addEventListener('mouseleave', (() => {
            this.isDrawing = false;
            this.lastX = null;
            this.lastY = null;
        }).bind(this));

        document.addEventListener('mousemove', ((e) => {
            if (!this.isDrawing) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.lastX !== null && this.lastY !== null) {
                const dx = x - this.lastX;
                const dy = y - this.lastY;
                const distance = Math.hypot(dx, dy);
                const steps = Math.ceil(distance / 2);

                for (let i = 0; i <= steps; i++) {
                    const interpX = this.lastX + (dx * i / steps);
                    const interpY = this.lastY + (dy * i / steps);
                    this.object.drawCircle(this.object.brushSize, interpX, interpY);
                }
                this.object.draw();
            }

            this.lastX = x;
            this.lastY = y;
        }).bind(this));


        // Mobile version
        this.canvas.addEventListener('touchstart', ((e) => {
            e.preventDefault();
            this.isDrawing = true;
            this.object.resetLogPoint();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.lastX = touch.clientX - rect.left;
            this.lastY = touch.clientY - rect.top;
            this.object.drawCircle(this.object.brushSize, this.lastX, this.lastY);
            this.object.draw();
        }).bind(this), {
            passive: false
        });

        document.addEventListener('touchend', (() => {
            this.isDrawing = false;
            this.lastX = null;
            this.lastY = null;
        }).bind(this));

        document.addEventListener('touchcancel', (() => {
            this.isDrawing = false;
            this.lastX = null;
            this.lastY = null;
        }).bind(this));

        document.addEventListener('touchmove', ((e) => {
            if (!this.isDrawing) return;
            e.preventDefault();

            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (this.lastX !== null && this.lastY !== null) {
                const dx = x - this.lastX;
                const dy = y - this.lastY;
                const distance = Math.hypot(dx, dy);
                const steps = Math.ceil(distance / 2);

                for (let i = 0; i <= steps; i++) {
                    const interpX = this.lastX + (dx * i / steps);
                    const interpY = this.lastY + (dy * i / steps);
                    this.object.drawCircle(this.object.brushSize, interpX, interpY);
                }
                this.object.draw();
            }

            this.lastX = x;
            this.lastY = y;
        }).bind(this), {
            passive: false
        });

    }


}