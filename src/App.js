import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

// --- Firebase Configuration ---
// This is now connected to YOUR personal Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyDlAZtI65wx-IO8bOwCwIy7gbjcDwuxy24",
  authDomain: "social-sudoku-45e90.firebaseapp.com",
  projectId: "social-sudoku-45e90",
  storageBucket: "social-sudoku-45e90.appspot.com",
  messagingSenderId: "902390577895",
  appId: "1:902390577895:web:bd75a65241cb162c6a0042",
  measurementId: "G-H0YB5XSC42",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Sudoku Puzzles and Solutions by Difficulty ---
const puzzles = {
  easy: {
    puzzle: [
      [0, 0, 3, 0, 2, 0, 6, 0, 0],
      [9, 0, 0, 3, 0, 5, 0, 0, 1],
      [0, 0, 1, 8, 0, 6, 4, 0, 0],
      [0, 0, 8, 1, 0, 2, 9, 0, 0],
      [7, 0, 0, 0, 0, 0, 0, 0, 8],
      [0, 0, 6, 7, 0, 8, 2, 0, 0],
      [0, 0, 2, 6, 0, 9, 5, 0, 0],
      [8, 0, 0, 2, 0, 3, 0, 0, 9],
      [0, 0, 5, 0, 1, 0, 3, 0, 0],
    ],
    solution: [
      [4, 8, 3, 9, 2, 1, 6, 5, 7],
      [9, 6, 7, 3, 4, 5, 8, 2, 1],
      [2, 5, 1, 8, 7, 6, 4, 9, 3],
      [5, 4, 8, 1, 3, 2, 9, 7, 6],
      [7, 2, 9, 5, 6, 4, 1, 3, 8],
      [1, 3, 6, 7, 9, 8, 2, 4, 5],
      [3, 7, 2, 6, 8, 9, 5, 1, 4],
      [8, 1, 4, 2, 5, 3, 7, 6, 9],
      [6, 9, 5, 4, 1, 7, 3, 8, 2],
    ],
  },
  medium: {
    puzzle: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  hard: {
    puzzle: [
      [0, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 6, 0, 0, 0, 0, 3],
      [0, 7, 4, 0, 8, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 3, 0, 0, 2],
      [0, 8, 0, 0, 4, 0, 0, 1, 0],
      [6, 0, 0, 5, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 7, 8, 0],
      [5, 0, 0, 0, 0, 9, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 4, 0],
    ],
    solution: [
      [1, 2, 6, 4, 3, 7, 9, 5, 8],
      [8, 9, 5, 6, 2, 1, 4, 7, 3],
      [3, 7, 4, 9, 8, 5, 1, 2, 6],
      [4, 5, 7, 1, 9, 3, 8, 6, 2],
      [9, 8, 3, 2, 4, 6, 5, 1, 7],
      [6, 1, 2, 5, 7, 8, 3, 9, 4],
      [2, 6, 9, 3, 1, 4, 7, 8, 5],
      [5, 4, 8, 7, 6, 9, 2, 3, 1],
      [7, 3, 1, 8, 5, 2, 6, 4, 9],
    ],
  },
  veryHard: {
    puzzle: [
      [8, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 3, 6, 0, 0, 0, 0, 0],
      [0, 7, 0, 0, 9, 0, 2, 0, 0],
      [0, 5, 0, 0, 0, 7, 0, 0, 0],
      [0, 0, 0, 0, 4, 5, 7, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 3, 0],
      [0, 0, 1, 0, 0, 0, 0, 6, 8],
      [0, 0, 8, 5, 0, 0, 0, 1, 0],
      [0, 9, 0, 0, 0, 0, 4, 0, 0],
    ],
    solution: [
      [8, 1, 2, 7, 5, 3, 6, 4, 9],
      [9, 4, 3, 6, 8, 2, 1, 7, 5],
      [6, 7, 5, 4, 9, 1, 2, 8, 3],
      [1, 5, 4, 2, 3, 7, 8, 9, 6],
      [3, 6, 9, 8, 4, 5, 7, 2, 1],
      [2, 8, 7, 1, 6, 9, 5, 3, 4],
      [5, 2, 1, 9, 7, 4, 3, 6, 8],
      [4, 3, 8, 5, 2, 6, 9, 1, 7],
      [7, 9, 6, 3, 1, 8, 4, 5, 2],
    ],
  },
};

// --- Main App Component ---
export default function App() {
  const [userId, setUserId] = useState(null);
  const [gameId, setGameId] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [board, setBoard] = useState(null);
  const [initialBoard, setInitialBoard] = useState(null);
  const [solution, setSolution] = useState(null);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
  const [joinGameId, setJoinGameId] = useState("");
  const [error, setError] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const MAX_MISTAKES = 3;

  // --- Authentication ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Authentication Error:", err);
          setError("Kunne ikke logge ind. Prøv venligst igen.");
          setIsAuthReady(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Game State Subscription ---
  useEffect(() => {
    if (!gameId || !isAuthReady) return;

    const gameDocRef = doc(db, "sudoku-games", gameId);
    const unsubscribe = onSnapshot(
      gameDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          try {
            const parsedBoard = JSON.parse(data.board);
            const parsedInitialBoard = JSON.parse(data.initialBoard);
            const parsedSolution = JSON.parse(data.solution);
            const currentMistakes = data.mistakes || 0;

            setBoard(parsedBoard);
            setInitialBoard(parsedInitialBoard);
            setSolution(parsedSolution);
            setMistakes(currentMistakes);

            if (currentMistakes >= MAX_MISTAKES) {
              setIsGameOver(true);
            } else {
              setIsGameOver(false);
            }

            checkIfSolved(parsedBoard, parsedSolution);
          } catch (e) {
            console.error("Error parsing game data:", e);
            setError("Fejl ved læsning af spildata.");
          }
        } else {
          setError("Spil ikke fundet. Tjek spil-ID.");
          setGameId("");
        }
      },
      (err) => {
        console.error("Firestore Snapshot Error:", err);
        setError("Fejl ved hentning af spildata.");
      }
    );

    return () => unsubscribe();
  }, [gameId, isAuthReady]);

  const checkIfSolved = useCallback((currentBoard, currentSolution) => {
    if (!currentBoard || !currentSolution) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] !== currentSolution[r][c]) {
          setIsSolved(false);
          return;
        }
      }
    }
    setIsSolved(true);
  }, []);

  // --- Game Actions ---
  const resetGameState = () => {
    setMistakes(0);
    setIsGameOver(false);
    setIsSolved(false);
    setError("");
    setSelectedCell({ row: null, col: null });
  };

  const createNewGame = async (isMultiplayer = true, difficulty = "medium") => {
    if (!isAuthReady || !userId) {
      setError("Godkendelse er ikke klar, prøv igen om et øjeblik.");
      return;
    }

    resetGameState();
    const newGameId = isMultiplayer
      ? `${difficulty}-${crypto.randomUUID().slice(0, 6)}`
      : `solo-${userId.slice(0, 8)}`;
    const puzzleData = puzzles[difficulty];

    const gameData = {
      board: JSON.stringify(puzzleData.puzzle),
      initialBoard: JSON.stringify(puzzleData.puzzle.map((row) => [...row])),
      solution: JSON.stringify(puzzleData.solution),
      difficulty: difficulty,
      createdAt: new Date(),
      players: [userId],
      mistakes: 0,
    };

    try {
      const gameDocRef = doc(db, "sudoku-games", newGameId);
      await setDoc(gameDocRef, gameData);
      setGameId(newGameId);
      setJoinGameId("");
    } catch (err) {
      console.error("Error creating game:", err);
      setError("Kunne ikke oprette et nyt spil.");
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!joinGameId.trim()) {
      setError("Indtast venligst et spil-ID.");
      return;
    }
    resetGameState();

    const gameDocRef = doc(db, "sudoku-games", joinGameId);
    const docSnap = await getDoc(gameDocRef);

    if (docSnap.exists()) {
      setGameId(joinGameId);
    } else {
      setError(`Spil med ID "${joinGameId}" blev ikke fundet.`);
    }
  };

  const leaveGame = () => {
    setGameId("");
    setBoard(null);
    setInitialBoard(null);
    setSolution(null);
    resetGameState();
  };

  const handleCellClick = (row, col) => {
    if (isGameOver) return;
    if (initialBoard && initialBoard[row][col] === 0) {
      setSelectedCell({ row, col });
    } else {
      setSelectedCell({ row: null, col: null });
    }
  };

  const handleNumberInput = async (number) => {
    if (
      selectedCell.row === null ||
      selectedCell.col === null ||
      !gameId ||
      !board ||
      isGameOver
    )
      return;

    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== 0) return;

    const newBoard = board.map((r, rIndex) =>
      r.map((c, cIndex) => (rIndex === row && cIndex === col ? number : c))
    );

    let newMistakes = mistakes;
    if (number !== 0 && solution[row][col] !== number) {
      newMistakes++;
    }

    try {
      const gameDocRef = doc(db, "sudoku-games", gameId);
      await setDoc(
        gameDocRef,
        {
          board: JSON.stringify(newBoard),
          mistakes: newMistakes,
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error updating board:", err);
      setError("Kunne ikke opdatere brættet.");
    }
  };

  const handleErase = () => {
    handleNumberInput(0);
  };

  const handleRestart = async () => {
    if (!initialBoard) return;
    const gameDocRef = doc(db, "sudoku-games", gameId);
    await setDoc(
      gameDocRef,
      {
        board: JSON.stringify(initialBoard),
        mistakes: 0,
      },
      { merge: true }
    );

    setIsGameOver(false);
    setIsSolved(false);
    setSelectedCell({ row: null, col: null });
  };

  // --- Render Logic ---
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-gray-700">
        Logger ind og godkender...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-800 flex flex-col items-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <header className="text-center mb-4">
          <h1 className="text-4xl font-bold text-slate-700">Social Sudoku</h1>
          <p className="text-slate-500">Løs gåder sammen med dine venner!</p>
        </header>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        {isSolved && !isGameOver && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center mb-4">
            <strong className="font-bold">Tillykke!</strong>
            <span className="block sm:inline"> I har løst gåden!</span>
          </div>
        )}

        {isGameOver && <GameOverModal onRestart={handleRestart} />}

        {!gameId ? (
          <Lobby
            onCreateGame={createNewGame}
            onJoinGame={handleJoinGame}
            joinGameId={joinGameId}
            setJoinGameId={setJoinGameId}
          />
        ) : (
          <GameBoard
            board={board}
            initialBoard={initialBoard}
            solution={solution}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
            onNumberInput={handleNumberInput}
            onErase={handleErase}
            onLeaveGame={leaveGame}
            gameId={gameId}
            mistakes={mistakes}
            maxMistakes={MAX_MISTAKES}
            isGameOver={isGameOver}
          />
        )}

        <footer className="text-center mt-6 text-sm text-slate-400">
          <p>
            Din User ID:{" "}
            <span className="font-mono bg-slate-200 px-1 rounded">
              {userId || "..."}
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}

// --- Sub-components ---
const GameOverModal = ({ onRestart }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-2xl text-center shadow-2xl transform transition-all scale-100">
      <h2 className="text-3xl font-bold mb-4 text-slate-800">Game Over</h2>
      <p className="mb-6 text-slate-600">Du har lavet for mange fejl.</p>
      <button
        onClick={onRestart}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105"
      >
        Prøv igen
      </button>
    </div>
  </div>
);

const Lobby = ({ onCreateGame, onJoinGame, joinGameId, setJoinGameId }) => {
  const [difficulty, setDifficulty] = useState("medium");
  const difficultyLabels = {
    easy: "Let",
    medium: "Medium",
    hard: "Svær",
    veryHard: "Meget svær",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold text-center mb-4 text-slate-600">
        Start et Nyt Spil
      </h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-center text-slate-500 mb-2">
          Vælg Sværhedsgrad
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.keys(difficultyLabels).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200
                                ${
                                  difficulty === level
                                    ? "bg-indigo-500 text-white shadow-md"
                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                }`}
            >
              {difficultyLabels[level]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => onCreateGame(false, difficulty)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Start Spil (Alene)
        </button>
        <button
          onClick={() => onCreateGame(true, difficulty)}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Start Spil (Sammen med andre)
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-center mb-4 text-slate-600">
          Deltag i et Spil
        </h2>
        <form onSubmit={onJoinGame} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={joinGameId}
            onChange={(e) => setJoinGameId(e.target.value)}
            placeholder="Indtast spil-ID for at joine"
            className="flex-grow px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Join Spil
          </button>
        </form>
      </div>
    </div>
  );
};

const GameBoard = ({
  board,
  initialBoard,
  solution,
  selectedCell,
  onCellClick,
  onNumberInput,
  onErase,
  onLeaveGame,
  gameId,
  mistakes,
  maxMistakes,
  isGameOver,
}) => (
  <div className="bg-white p-4 rounded-2xl shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={onLeaveGame}
        className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded-lg transition"
      >
        Forlad spil
      </button>
      <div className="font-semibold text-red-500">
        Fejl: {mistakes} / {maxMistakes}
      </div>
      <div className="text-sm text-slate-500">
        Spil ID:{" "}
        <span className="font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded-md">
          {gameId}
        </span>
      </div>
    </div>

    {!board || !solution ? (
      <div className="aspect-square flex items-center justify-center text-slate-500">
        Henter bræt...
      </div>
    ) : (
      <div
        className={`grid grid-cols-9 grid-rows-9 gap-0.5 aspect-square bg-slate-300 rounded-lg overflow-hidden border-2 border-slate-400 ${
          isGameOver ? "opacity-50" : ""
        }`}
      >
        {board.map((row, rIndex) =>
          row.map((cell, cIndex) => {
            const isSelected =
              selectedCell.row === rIndex && selectedCell.col === cIndex;
            const isInitial =
              initialBoard && initialBoard[rIndex][cIndex] !== 0;
            const isWrong =
              cell !== 0 &&
              !isInitial &&
              solution &&
              cell !== solution[rIndex][cIndex];

            const borderClasses = `
                            ${cIndex === 2 || cIndex === 5 ? "border-r-2" : ""}
                            ${rIndex === 2 || rIndex === 5 ? "border-b-2" : ""}
                            border-slate-400
                        `;

            return (
              <div
                key={`${rIndex}-${cIndex}`}
                onClick={() => onCellClick(rIndex, cIndex)}
                className={`flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold cursor-pointer transition-colors duration-150 ${borderClasses}
                                    ${
                                      isInitial
                                        ? "bg-slate-200 text-slate-800"
                                        : "bg-white"
                                    }
                                    ${
                                      isSelected && !isGameOver
                                        ? "bg-blue-200"
                                        : ""
                                    }
                                    ${
                                      isWrong ? "text-red-500" : "text-blue-600"
                                    }
                                `}
              >
                {cell !== 0 ? cell : ""}
              </div>
            );
          })
        )}
      </div>
    )}

    <div
      className={`mt-4 ${isGameOver ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onNumberInput(num)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg text-xl transition transform hover:scale-105"
          >
            {num}
          </button>
        ))}
        <button
          onClick={onErase}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition transform hover:scale-105"
        >
          Slet
        </button>
      </div>
    </div>
  </div>
);
