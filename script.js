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
        let numbers = shuffle([...Array(side).keys()].map(x => x + 1));
        for (let row = 0; row < side; row++) {
            for (let col = 0; col < side; col++) {
                if (board[row][col] === 0) {
                    for (let num of numbers) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (fillBoard(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function unfill(board, cells, minNumbersPerSubgrid = 2) {
        let base = 3;
        let side = base * base;
        let cellsToRemove = cells;
        let maxAttempts = side * side * 10; // Safeguard against infinite loops

        function getSubgridIndex(row, col) {
            return Math.floor(row / base) * base + Math.floor(col / base);
        }

        let subgridFilledCount = Array.from({ length: side }, () => 0);
        for (let row = 0; row < side; row++) {
            for (let col = 0; col < side; col++) {
                if (board[row][col] !== 0) {
                    subgridFilledCount[getSubgridIndex(row, col)]++;
                }
            }
        }

        let attempts = 0;

        while (cellsToRemove > 0 && attempts < maxAttempts) {
            attempts++;
            let row = Math.floor(Math.random() * side);
            let col = Math.floor(Math.random() * side);
            let subgridIndex = getSubgridIndex(row, col);

            if (board[row][col] !== 0 && subgridFilledCount[subgridIndex] > minNumbersPerSubgrid) {
                board[row][col] = 0;
                subgridFilledCount[subgridIndex]--;
                cellsToRemove--;
            }
        }

        console.log(`Unfilled ${cells - cellsToRemove} cells in ${attempts} attempts`);
        if (cellsToRemove > 0) {
            console.warn(`Could not unfill ${cellsToRemove} cells due to constraints.`);
        }
    }

    fillBoard(board);

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

    console.log(`Generating Sudoku with difficulty: ${difficulty}, cells to unfill: ${cellsToUnfill}`);
    unfill(board, cellsToUnfill);

    return board;
}

function displaySudoku(difficulty) {
    console.log('Displaying Sudoku with difficulty:', difficulty); // Debug log
    const table = document.querySelector('table');
    const puzzle = generateSudoku(difficulty);
    clearBoard(table);

    for (let i = 0; i < 9; i++) {
        const row = table.insertRow();
        for (let j = 0; j < 9; j++) {
            const cell = row.insertCell();
            const value = puzzle[i][j] || '';
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed'); // Debug log

    // Initial display with hard difficulty
    displaySudoku('hard'); // Default difficulty

    // Set the hard button as active
    document.getElementById('hard').classList.add('active');

    // Manage button active state
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Button clicked:', this.id); // Debug log
            const userConfirmed = confirm('New Game?');
            if (userConfirmed) {
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                displaySudoku(this.id); // Update to call displaySudoku with the button id (difficulty)
            }
        });
    });
});
