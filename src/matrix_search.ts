export interface Matrix {
    rows(): number;
    cols(): number;
    valueAt(row: number, col: number): number;
}

// Recursive helper for SMAWK/Monotone Max
function solveRecursive(
    matrix: Matrix,
    rows: number[],
    c_min: number,
    c_max: number,
    results: number[]
) {
    if (rows.length === 0) return;

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

    // Recurse Left
    const leftRows = rows.slice(0, midIdx);
    solveRecursive(matrix, leftRows, c_min, bestCol, results);

    // Recurse Right
    const rightRows = rows.slice(midIdx + 1);
    solveRecursive(matrix, rightRows, bestCol, c_max, results);
}

export function monotoneMax(matrix: Matrix): number[] {
    const numRows = matrix.rows();
    const results = new Array(numRows).fill(0);

    if (numRows === 0 || matrix.cols() === 0) return results;

    const allRows = Array.from({ length: numRows }, (_, i) => i);
    solveRecursive(matrix, allRows, 0, matrix.cols() - 1, results);

    return results;
}
