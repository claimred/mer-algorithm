export interface Matrix {
    rows(): number;
    cols(): number;
    valueAt(row: number, col: number): number;
}

// Iterative helper for SMAWK/Monotone Max
interface Job {
    rows: number[];
    c_min: number;
    c_max: number;
}

export function monotoneMax(matrix: Matrix): number[] {
    const numRows = matrix.rows();
    const results = new Array(numRows).fill(0);

    if (numRows === 0 || matrix.cols() === 0) return results;

    const allRows = Array.from({ length: numRows }, (_, i) => i);

    // Explicit Stack
    const stack: Job[] = [];
    stack.push({
        rows: allRows,
        c_min: 0,
        c_max: matrix.cols() - 1
    });

    while (stack.length > 0) {
        const job = stack.pop()!;
        const { rows, c_min, c_max } = job;

        if (rows.length === 0) continue;

        const midIdx = Math.floor(rows.length / 2);
        const row = rows[midIdx];

        // Find max for this row in [c_min, c_max]
        let bestCol = -1;
        let maxVal = -1e300; // -Infinity

        const startCol = Math.max(0, c_min);
        const endCol = Math.min(matrix.cols() - 1, c_max);

        for (let c = startCol; c <= endCol; c++) {
            const val = matrix.valueAt(row, c);
            if (val > maxVal) {
                maxVal = val;
                bestCol = c;
            }
        }

        results[row] = bestCol;

        // Push sub-problems (Right first so Left pops first, preserving order or parallel doesn't matter)
        // Right
        if (midIdx + 1 < rows.length) {
            const rightRows = rows.slice(midIdx + 1);
            stack.push({ rows: rightRows, c_min: bestCol, c_max: c_max });
        }

        // Left
        if (midIdx > 0) {
            const leftRows = rows.slice(0, midIdx);
            stack.push({ rows: leftRows, c_min, c_max: bestCol });
        }
    }

    return results;
}
