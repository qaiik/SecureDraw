function base64ToUint8(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// window.top.b6t = base64ToUint8
function toUint16(uint16s) {
    return uint16s.map(uint16 => {
        return [
            (uint16 >> 8) & 0xFF, // High byte (8 most significant bits)
            uint16 & 0xFF // Low byte (8 least significant bits)
        ];
    }).flat()
}

function fromUint16(byteArrays) {
    // if (byteArray.length !== 2) {
    //   throw new Error("Array must contain exactly two bytes.");
    // }

    const op = []
    for (let i = 0; i < byteArrays.length; i += 2) {
        op.push((byteArrays[i] << 8) | byteArrays[i + 1]); // Shift high byte and OR with low byte
    }
    return op
}

function chars(t) {
    return Array.from(t).map(n => n.charCodeAt(0))
}

class AnonymousDrawSystemCanvas {
    #canvas;
    #log;
    #ctx;
    #binaryLog;
    #lastLogged = null; // Add #lastLogged as a private field
    brushSize;
    currentColor;
    w;
    h;

    constructor(w, h, brushSize = 1, defaultColor = "black", minSize = 1, acc) {
        this.#canvas = document.createElement('canvas');
        this.#binaryLog = [];
        this.#canvas.width = w;
        this.#canvas.height = h;
        this.w = w;
        this.h = h;
        this.#log = "";
        this.brushSize = brushSize;
        this.currentColor = defaultColor;
        this.#ctx = this.#canvas.getContext('2d');
        this.accuracy = acc;
    }

    #distance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    resetLogPoint() {
        this.#lastLogged = null;
    }

    drawCircle(size = 5, canvasX = 0, canvasY = 0) {
        if (size > 255) {
            return;
        }

        this.#ctx.beginPath();
        this.#ctx.arc(canvasX, canvasY, size, 0, 2 * Math.PI);
        this.#ctx.fillStyle = this.currentColor; // Use current color
        this.#ctx.fill();

        // Log only if the distance is not exactly 0,0 (i.e., the points are not the same)
        if (!this.#lastLogged || this.#distance(this.#lastLogged, {
                x: canvasX,
                y: canvasY
            }) !== 0) {
            this.#log += `CIRCLE ${size} ${canvasX.toFixed(this.accuracy)} ${canvasY.toFixed(this.accuracy)}\n`; // Log without color
            //console.log('anon:', 'cx:', canvasX.toFixed(this.accuracy), 'cy:', canvasY.toFixed(this.accuracy))
            const data1 = canvasX.toFixed(this.accuracy) + ',' + canvasY.toFixed(this.accuracy)
            this.#binaryLog.push(1, size, ...chars(`${String.fromCharCode(data1.length)}${data1}`))
            this.#lastLogged = {
                x: canvasX,
                y: canvasY
            };
        }
    }


    out() {
        return this.#canvas.toDataURL();
    }

    getBinary() {
        return this.#binaryLog;
    }

    getLog() {
        return this.#log;
    }

    wipe() {
        this.#ctx.fillStyle = "#FFFFFF";
        this.#ctx.fillRect(0, 0, this.w, this.h);
        this.#log = "";
        this.#binaryLog = []
    }

    loadFromLog(log) {
        this.wipe();
        const lines = log.split("\n");
        for (const line of lines) {
            const s = line.split(" ");
            const command = s[0];
            if (command === "SETCOLOR") {
                const color = s[1];
                this.setColor(color); // Set color based on log entry
            } else if (command === "CIRCLE") {
                const size = s[1];
                const canvasX = s[2];
                const canvasY = s[3];
                this.drawCircle(size, canvasX, canvasY);
            }
        }
    }

    loadFromBinary(binarylog, draw = true) {
        this.#log = "";
        this.#binaryLog = []
        let n = 0;

        while (n < binarylog.length) {
            switch (binarylog[n]) {
                case 1:
                    const size = binarylog[++n]; // Step 1: Get the size
                    let positionStr = "";
                    const length1 = binarylog[++n]; // Get the length of the first data (data1)
                    for (let i = 0; i < length1; i++) {
                        n++;
                        positionStr += String.fromCharCode(binarylog[n]); // Rebuild data1 from its character codes
                    }

                    // Step 4: Read the second string (data2)


                    // //console.log(size, a,b,c,d)
                    const [positionx, positiony] = positionStr.split(',')
                    this.drawCircle(size, +positionx, +positiony)
                    n++
                    break
                case 2:
                    const len = binarylog[++n];
                    const chars = binarylog.slice(n + 1, n + 1 + len);
                    const string = String.fromCharCode(...chars);
                    n += len;


                    this.setColor(string)
                    break
                default:
                    n++
                    break
            }

        }
    }

    // Set brush size
    setSize(newSize) {
        this.brushSize = newSize;
    }

    // Set current color
    setColor(newColor) {
        this.currentColor = newColor;
        this.#log += `SETCOLOR ${newColor}\n`; // Log color change
        this.#binaryLog.push(2, newColor.length, ...chars(newColor))
    }

    fromBase64(b, draw = true) {
        return this.loadFromBinary(Array.from(base64ToUint8(b, draw)))
    }

    toBase64() {
        let binary = '';
        for (let i = 0; i < this.#binaryLog.length; i++) {
            binary += String.fromCharCode(this.#binaryLog[i]);
        }
        return btoa(binary);
    }

}

class PublicDrawSystemCanvas {
    #canvas;
    #log;
    #colors = [];
    #ctx;
    #binaryLog;
    #lastLogged = null;

    constructor(publicCanvas, brushSize = 1, defaultColor = "black", minSize = 1, acc) {
        this.publicCanvas = publicCanvas;
        this.#canvas = document.createElement('canvas');
        this.#binaryLog = [];
        this.#canvas.width = publicCanvas.width;
        this.#canvas.height = publicCanvas.height;
        this.w = publicCanvas.width;
        this.h = publicCanvas.height;
        this.#log = "";
        this.brushSize = brushSize;
        this.#ctx = this.#canvas.getContext('2d');
        this.minSize = minSize;
        this.currentColor = defaultColor; // Default color
        this.accuracy = acc;
    }

    #distance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    resetLogPoint() {
        this.#lastLogged = null;
    }

    drawCircle(size = 5, canvasX = 0, canvasY = 0) {
        this.#ctx.beginPath();
        this.#ctx.arc(canvasX, canvasY, size, 0, 2 * Math.PI);
        this.#ctx.fillStyle = this.currentColor; // Use current color
        this.#ctx.fill();

        // Log only if the position is not the same as the last logged point
        if (!this.#lastLogged || (this.#lastLogged.x !== canvasX || this.#lastLogged.y !== canvasY)) {
            this.#log += `CIRCLE ${size} ${canvasX.toFixed(this.accuracy)} ${canvasY.toFixed(this.accuracy)}\n`; // Log without color
            //console.log(canvasX, canvasY)
            const data1 = canvasX.toFixed(this.accuracy) + ',' + canvasY.toFixed(this.accuracy)
            this.#binaryLog.push(1, size, ...chars(`${String.fromCharCode(data1.length)}${data1}`))
            this.#lastLogged = {
                x: canvasX,
                y: canvasY
            };
        }
    }

    draw() {
        const ctx = this.publicCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.drawImage(this.#canvas, 0, 0);
    }

    out() {
        return this.#canvas.toDataURL();
    }

    getBinary() {
        return this.#binaryLog;
    }

    getLog() {
        return this.#log;
    }

    wipe() {
        this.#ctx.fillStyle = "#FFFFFF";
        this.#ctx.fillRect(0, 0, this.w, this.h);
        this.draw(); // update public view too
        this.#log = "";
        this.#binaryLog = []
        this.resetLogPoint();
    }

    loadFromLog(log) {
        this.#log = "";
        this.wipe();
        const lines = log.split("\n");
        for (const line of lines) {
            const s = line.split(" ");
            const command = s[0];
            if (command == "CIRCLE") {
                const size = Number(s[1]);
                const canvasX = Number(s[2]);
                const canvasY = Number(s[3]);
                this.drawCircle(size, canvasX, canvasY); // Draw circle without color in log
            }
            if (command == "SETCOLOR") {
                const color = s[1];
                this.setColor(color); // Set color from log
            }
        }
        this.draw();
    }

    loadFromBinary(binarylog, draw = true) {
        this.#log = "";
        this.#binaryLog = []
        let n = 0;

        while (n < binarylog.length) {
            switch (binarylog[n]) {
                case 1:
                    const size = binarylog[++n]; // Step 1: Get the size
                    let positionStr = "";
                    const length1 = binarylog[++n]; // Get the length of the first data (data1)
                    for (let i = 0; i < length1; i++) {
                        n++;
                        positionStr += String.fromCharCode(binarylog[n]); // Rebuild data1 from its character codes
                    }

                    // Step 4: Read the second string (data2)


                    // //console.log(size, a,b,c,d)
                    const [positionx, positiony] = positionStr.split(',')
                    this.drawCircle(size, +positionx, +positiony)
                    n++
                    break
                case 2:
                    const len = binarylog[++n];
                    const chars = binarylog.slice(n + 1, n + 1 + len);
                    const string = String.fromCharCode(...chars);
                    n += len;


                    this.setColor(string)
                    break
                default:
                    n++
                    break
            }

        }
    }

    setColor(newColor) {
        this.currentColor = newColor;
        this.#log += `SETCOLOR ${newColor}\n`; // Log color change
        this.#binaryLog.push(2, newColor.length, ...chars(newColor))
    }

    setSize(newSize) {
        this.brushSize = newSize;
    }

    fromBase64(b, draw = true) {
        return this.loadFromBinary(Array.from(base64ToUint8(b, draw)))
    }

    toBase64() {
        let binary = '';
        for (let i = 0; i < this.#binaryLog.length; i++) {
            binary += String.fromCharCode(this.#binaryLog[i]);
        }
        return btoa(binary);
    }

}



export const Public = PublicDrawSystemCanvas;
export const Private = AnonymousDrawSystemCanvas;