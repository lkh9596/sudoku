let solutionBoard;

function clearBoard(table) {
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function generateSudoku(difficulty) {
    let base = 3;
    let side = base * base;
    let board = Array.from({ length: side }, () => Array(side).fill(0));

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function isValid(board, row, col, num) {
        for (let x = 0; x < side; x++) {
            if (board[row][x] === num || board[x][col] === num || board[Math.floor(row / base) * base + Math.floor(x / base)][Math.floor(col / base) * base + x % base] === num) {
                return false;
            }
        }
        return true;
    }

    function fillBoard(board) {
        // Find empty cell with the fewest valid candidates (MRV)
        let bestRow = -1, bestCol = -1;
        let bestCandidates = null;

        for (let r = 0; r < side; r++) {
            for (let c = 0; c < side; c++) {
                if (board[r][c] !== 0) continue;

                const candidates = [];
                for (let num = 1; num <= side; num++) {
                    if (isValid(board, r, c, num)) candidates.push(num);
                }

                // Dead end
                if (candidates.length === 0) return false;

                if (bestCandidates === null || candidates.length < bestCandidates.length) {
                    bestCandidates = candidates;
                    bestRow = r;
                    bestCol = c;

                    // Can't do better than 1
                    if (bestCandidates.length === 1) break;
                }
            }
            if (bestCandidates && bestCandidates.length === 1) break;
        }

        // No empties => solved
        if (bestCandidates === null) return true;

        // Randomize to keep puzzles varied
        shuffle(bestCandidates);

        for (const num of bestCandidates) {
            board[bestRow][bestCol] = num;
            if (fillBoard(board)) return true;
            board[bestRow][bestCol] = 0;
        }
        return false;
    }

    function countSolutions(board, limit = 2) {
        // Find empty cell with the fewest candidates (MRV)
        let bestRow = -1, bestCol = -1;
        let bestCandidates = null;

        for (let r = 0; r < side; r++) {
            for (let c = 0; c < side; c++) {
                if (board[r][c] !== 0) continue;

                const candidates = [];
                for (let num = 1; num <= side; num++) {
                    if (isValid(board, r, c, num)) candidates.push(num);
                }

                // Dead end => no solution on this branch
                if (candidates.length === 0) return 0;

                if (bestCandidates === null || candidates.length < bestCandidates.length) {
                    bestCandidates = candidates;
                    bestRow = r;
                    bestCol = c;
                    if (bestCandidates.length === 1) break;
                }
            }
            if (bestCandidates && bestCandidates.length === 1) break;
        }

        // No empties => found one full solution
        if (bestCandidates === null) return 1;

        shuffle(bestCandidates);

        let count = 0;
        for (const num of bestCandidates) {
            board[bestRow][bestCol] = num;
            count += countSolutions(board, limit);
            board[bestRow][bestCol] = 0;

            if (count >= limit) return count; // early exit
        }
        return count;
    }
    

    function unfillBalancedUniqueSymmetric(board, cellsToRemove, opts = {}) {
        const {
            // Aesthetic balance constraints (avoid empty rows/cols/boxes)
            minRowClues = 1,
            minColClues = 1,
            minBoxClues = 1,

            // Optional “don’t let one box stay too dense” cap (purely aesthetic)
            maxBoxClues = 9,

            // Symmetry makes it look intentional (removes in pairs)
            symmetric = true,

            // Safeguards
            maxPasses = 20,          // how many full passes over candidates
            maxAttempts = 20000      // total removal attempts before giving up this run
        } = opts;

        function boxIndex(r, c) {
            return Math.floor(r / base) * base + Math.floor(c / base);
        }

        // Count initial clues
        const rowCount = Array(side).fill(0);
        const colCount = Array(side).fill(0);
        const boxCount = Array(side).fill(0);

        for (let r = 0; r < side; r++) {
            for (let c = 0; c < side; c++) {
                if (board[r][c] !== 0) {
                    rowCount[r]++;
                    colCount[c]++;
                    boxCount[boxIndex(r, c)]++;
                }
            }
        }

        // Candidate list: all filled cells (we will try to remove from densest areas first)
        const cells = [];
        for (let r = 0; r < side; r++) {
            for (let c = 0; c < side; c++) {
                if (board[r][c] !== 0) cells.push([r, c]);
            }
        }

        // Shuffle once to avoid always same look
        shuffle(cells);

        // Helper to compute "density score" (higher score = better candidate to remove)
        function scoreCell(r, c) {
            const b = boxIndex(r, c);
            return rowCount[r] + colCount[c] + boxCount[b];
        }

        // Pick cells in a way that prefers dense regions
        function sortedCandidates() {
            // Sort by score descending (dense first). Stable enough for small list.
            return cells
                .filter(([r, c]) => board[r][c] !== 0)
                .sort((a, b) => scoreCell(b[0], b[1]) - scoreCell(a[0], a[1]));
        }

        function canRemoveSingle(r, c) {
            const b = boxIndex(r, c);
            if (rowCount[r] <= minRowClues) return false;
            if (colCount[c] <= minColClues) return false;
            if (boxCount[b] <= minBoxClues) return false;
            return true;
        }

        function applyRemove(r, c) {
            const b = boxIndex(r, c);
            board[r][c] = 0;
            rowCount[r]--;
            colCount[c]--;
            boxCount[b]--;
        }

        function revertRemove(r, c, val) {
            const b = boxIndex(r, c);
            board[r][c] = val;
            rowCount[r]++;
            colCount[c]++;
            boxCount[b]++;
        }

        function passesAestheticCaps() {
            // Only box cap here (row/col caps aren’t needed; min constraints already enforced)
            for (let b = 0; b < side; b++) {
                if (boxCount[b] > maxBoxClues) return false;
            }
            return true;
        }

        let removed = 0;
        let attempts = 0;

        // For symmetry, removals should be even unless the center cell is removed once
        const target = cellsToRemove;

        // If we want an odd number of removals with symmetry, we MUST remove the center cell once.
        if (symmetric && (target % 2 === 1)) {
            const cr = Math.floor(side / 2); // 4
            const cc = Math.floor(side / 2); // 4

            if (board[cr][cc] === 0) return false; // shouldn't happen

            if (!canRemoveSingle(cr, cc)) return false;

            const saved = board[cr][cc];
            applyRemove(cr, cc);

            const test = board.map(row => row.slice());
            const solCount = countSolutions(test, 2);

            if (solCount === 1) {
                removed += 1;
            } else {
                revertRemove(cr, cc, saved);
                return false; // force a restart; this solution grid can't support odd-symmetric target
            }
        }

        for (let pass = 0; pass < maxPasses && removed < target && attempts < maxAttempts; pass++) {
            const candidates = sortedCandidates();

            for (const [r1, c1] of candidates) {
                if (removed >= target || attempts >= maxAttempts) break;
                if (board[r1][c1] === 0) continue;

                // Determine symmetric partner
                const r2 = side - 1 - r1;
                const c2 = side - 1 - c1;

                // Determine how many cells we'd remove this step
                const isCenter = (r1 === r2 && c1 === c2);
                const stepSize = (symmetric && !isCenter) ? 2 : 1;

                // Don’t overshoot target
                if (removed + stepSize > target) continue;

                // Must be removable according to min constraints
                if (!canRemoveSingle(r1, c1)) continue;
                if (symmetric && !isCenter) {
                    if (board[r2][c2] === 0) continue;
                    if (!canRemoveSingle(r2, c2)) continue;
                }

                attempts++;

                // Save values and remove
                const v1 = board[r1][c1];
                const v2 = (symmetric && !isCenter) ? board[r2][c2] : null;

                applyRemove(r1, c1);
                if (symmetric && !isCenter) applyRemove(r2, c2);

                // Aesthetic cap check (optional but helps avoid ugly “dense box”)
                if (!passesAestheticCaps()) {
                    // revert immediately
                    revertRemove(r1, c1, v1);
                    if (symmetric && !isCenter) revertRemove(r2, c2, v2);
                    continue;
                }

                // Uniqueness check on a copy (critical)
                const test = board.map(row => row.slice());
                const solCount = countSolutions(test, 2);

                if (solCount === 1) {
                    removed += stepSize;
                } else {
                    // revert if not unique
                    revertRemove(r1, c1, v1);
                    if (symmetric && !isCenter) revertRemove(r2, c2, v2);
                }
            }
        }

        return removed === target;
    }

    // Determine the number of cells to unfill based on difficulty
    let cellsToUnfill;
    if (difficulty === 'easy') {
        cellsToUnfill = 35;
    } else if (difficulty === 'medium') {
        cellsToUnfill = 45;
    } else if (difficulty === 'hard') {
        cellsToUnfill = 55;
    } else {
        throw new Error(`Unknown difficulty: ${difficulty}`);
    }

    // Try multiple times to get exactly the requested removals while keeping uniqueness + balance
    const maxRestarts = 30;
    let success = false;

    let bestPuzzle = null;
    let bestRemoved = -1;

    for (let attempt = 1; attempt <= maxRestarts; attempt++) {
    // fresh solved grid
    board = Array.from({ length: side }, () => Array(side).fill(0));
    fillBoard(board);
    solutionBoard = board.map(r => r.slice());

    // try to carve a puzzle
    const puzzle = board.map(r => r.slice());

    // IMPORTANT: make box cap non-blocking
    const ok = unfillBalancedUniqueSymmetric(puzzle, cellsToUnfill, {
        minRowClues: 1,
        minColClues: 1,
        minBoxClues: 1,
        maxBoxClues: 9,     // <-- change to 9 for now
        symmetric: true,
        maxPasses: 25,
        maxAttempts: 30000
    });

    // Count how many were removed (so we can keep the best attempt)
    const removedNow = puzzle.flat().filter(v => v === 0).length;

    if (removedNow > bestRemoved) {
        bestRemoved = removedNow;
        bestPuzzle = puzzle;
    }

    if (ok) {
        success = true;
        bestPuzzle = puzzle;
        console.log(`Succeeded: removed exactly ${cellsToUnfill} on restart #${attempt}`);
        break;
    } else {
        console.warn(`Restart #${attempt} did not hit exactly ${cellsToUnfill}. Removed ${removedNow} instead.`);
    }
    }

    if (!bestPuzzle) {
    throw new Error("Puzzle generation failed completely.");
    }

    if (!success) {
    console.warn(`Could not hit exactly ${cellsToUnfill} removals after ${maxRestarts} restarts. Using best attempt: removed ${bestRemoved}.`);
    }

    board = bestPuzzle;
    console.log("Zeros in returned board:", board.flat().filter(v => v === 0).length);
    return board;

}

function displaySudoku(board) {
    const table = document.querySelector('table');
    clearBoard(table);

    for (let i = 0; i < 9; i++) {
        const row = table.insertRow();
        for (let j = 0; j < 9; j++) {
            const cell = row.insertCell();
            const value = board[i][j] || '';
            if (value) {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.value = value;
                input.disabled = true; // Disable prefilled cells
                input.className = 'sudoku-input';
                cell.appendChild(input);
            } else {
                const div = document.createElement('div');
                div.className = 'sudoku-input'; // Same class for consistent styling
                cell.appendChild(div);
            }
        }
    }
}

function initSudoku(difficulty) {
    const board = generateSudoku(difficulty);
    displaySudoku(board);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed'); // Debug log

    // Initial display with hard difficulty
    initSudoku('hard'); // Default difficulty

    // Set the hard button as active
    document.getElementById('hard').classList.add('active');

    // Manage button active state
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Button clicked:', this.id); // Debug log
            if (this.id !== 'show-answer') {
                const userConfirmed = confirm('새 게임을 시작하시겠습니까?');
                if (userConfirmed) {
                    buttons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    initSudoku(this.id); // Update to call initSudoku with the button id (difficulty)
                }
            } else {
                const userConfirmed = confirm('정답을 확인하시겠습니까?');
                if (userConfirmed) {
                    displaySudoku(solutionBoard); // Display the solution board
                }
            }
        });
    });
});
