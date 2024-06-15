function clearBoard(table) {
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function generateSudoku(difficulty) {
    let base = 3;
    let side = base * base;
    let board = Array.from({ length: side }, () => Array(side).fill(0));

    function shuffle(s) {
        for (let i = s.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [s[i], s[j]] = [s[j], s[i]];
        }
        return s;
    }

    function pattern(r, c) {
        return (base * (r % base) + Math.floor(r / base) + c) % side;
    }

    function generate() {
        let numbers = shuffle([...Array(side).keys()].map(x => x + 1));
        for (let i = 0; i < side; i++) {
            for (let j = 0; j < side; j++) {
                board[i][j] = numbers[pattern(i, j)];
            }
        }
    }

    function unfill(board, cells, minNumbersPerSubgrid = 3) {
        let base = 3;
        let side = base * base;
        let subgridSize = 3;
        let attempts = cells;
        let maxAttempts = cells * 2; // Safeguard against infinite loops
        let attemptCount = 0;

        function getSubgridIndex(row, col) {
            return Math.floor(row / subgridSize) * subgridSize + Math.floor(col / subgridSize);
        }

        // Track number of filled cells in each subgrid
        let subgridFilledCount = Array.from({ length: side }, () => 0);
        for (let row = 0; row < side; row++) {
            for (let col = 0; col < side; col++) {
                if (board[row][col] !== 0) {
                    subgridFilledCount[getSubgridIndex(row, col)]++;
                }
            }
        }

        while (attempts > 0 && attemptCount < maxAttempts) {
            attemptCount++;
            let row = Math.floor(Math.random() * side);
            let col = Math.floor(Math.random() * side);
            let subgridIndex = getSubgridIndex(row, col);

            // Ensure each subgrid keeps at least minNumbersPerSubgrid cells filled
            if (board[row][col] !== 0 && subgridFilledCount[subgridIndex] > minNumbersPerSubgrid) {
                board[row][col] = 0;
                subgridFilledCount[subgridIndex]--;
                attempts--;
            }
        }

        console.log(`Unfilled ${cells - attempts} cells in ${attemptCount} attempts`);
    }

    generate(); // Fill the entire board
    unfill(board, difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55);

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
            cell.textContent = puzzle[i][j] || '';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed'); // Debug log

    // Initial display with medium difficulty
    displaySudoku('medium'); // Default difficulty

    // Set the medium button as active
    document.getElementById('medium').classList.add('active');

    // Manage button active state
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Button clicked:', this.id); // Debug log
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            displaySudoku(this.id); // Update to call displaySudoku with the button id (difficulty)
        });
    });
});
