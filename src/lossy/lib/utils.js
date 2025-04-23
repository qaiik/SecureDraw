export function averageSCD(log) {
    const lines = log.trim().split("\n");
    const distances = [];
    let countSinceLastSetColor = 0;
    let setColorCount = 0;

    for (const line of lines) {
        if (line.startsWith("SETCOLOR")) {
            if (setColorCount > 0) {
                distances.push(countSinceLastSetColor);
            }
            setColorCount++;
            countSinceLastSetColor = 0;
        } else if (line.startsWith("CIRCLE")) {
            countSinceLastSetColor++;
        }
    }

    if (setColorCount === 0) return null;
    if (setColorCount === 1) return 0;

    const sum = distances.reduce((a, b) => a + b, 0);
    return sum / distances.length;
}

export function verifyLog(log, options = {
    usesExactColor: false,
    minSize: 1,
    //minAverageSCD: 20
}) {

    if (options.minAverageSCD) {
        const average = averageSCD(log)
        if (average == null || average == 0) return true;
        if (average < options.minAverageSCD) return false;
    }
    const lines = log.split("\n");
    for (const line of lines) {
        const split = line.split(" ")
        const sizeParam = split[1]
        if (split[0] == "SETCOLOR") {
            const colorparam = split[1]
            if ((colorparam.startsWith("#") || colorparam.startsWith('rgb')) && options.exactColor) return false;
        }

        if (options.minSize && Number(sizeParam) < options.minSize) return false
    }


    return true;
}