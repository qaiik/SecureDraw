import { Public, Private } from "./lib/backend";
import { verifyLog } from "./lib/utils";

export default class Display {
    constructor(projectionCanvas, validationSettings) {
        //minAverageSCD: Minimum Average SetColor Distance
        this.validationSettings = validationSettings;
        this.usesHumanization = validationSettings.minAverageSCD ? true : false;
        this.exactColor = validationSettings.allowExactColor || false;
        this.pc = projectionCanvas;
        this.object = new Public(projectionCanvas, 1, "black", validationSettings.minBrushSize)
        this.minBrushSize = this.validationSettings.minBrushSize;
        this.object.wipe();
    }

    loadBase64(b) {
        const temp = new Private(this.pc.width, this.pc.height, 1, "black", this.minBrushSize)
        temp.fromBase64(b)
        const log = temp.getLog()
        const isv = verifyLog(log, {
            exactColor: this.exactColor,
            minSize: this.minBrushSize,
            minAverageSCD: this.usesHumanization ? this.validationSettings.minAverageSCD : null
        })
        if (isv) this.object.loadFromLog(log);
        return isv

    }

    loadBinary(b) {
        const temp = new Private(this.pc.width, this.pc.height, 1, "black", this.minBrushSize)
        temp.loadFromBinary(b)
        const log = temp.getLog()
        const isv = verifyLog(log, {
            exactColor: this.exactColor,
            minSize: this.minBrushSize,
            minAverageSCD: this.usesHumanization ? this.validationSettings.minAverageSCD : null
        })
        if (isv) this.object.loadFromLog(log);
        return isv
    }

    clear() {
        this.object.wipe()
    }
}