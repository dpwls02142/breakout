import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ballImageSrc from './ball.png';
import brickHitSoundSrc from './poyo.mp3';
import backgroundMusicSrc from './181.mp3';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BRICK_ROWS = 5;
const BRICK_COLUMNS = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BALL_RADIUS = 16;

const App = () => {
  const canvasRef = useRef(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [ballSpeed, setBallSpeed] = useState(3);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const backgroundMusic = useRef(new Audio(backgroundMusicSrc));
  const brickHitSound = new Audio(brickHitSoundSrc);
  const ballImage = useRef(null);

  let animationFrameId = null; 

  useEffect(() => {
    ballImage.current = new Image();
    ballImage.current.src = ballImageSrc;
  }, []);

  useEffect(() => {
    if (gameStarted) {
      backgroundMusic.current.loop = true;
      backgroundMusic.current.play();
    }
    return () => backgroundMusic.current.pause();
  }, [gameStarted]);

  useEffect(() => {
    if (gameOver || gameWon) {
      backgroundMusic.current.pause();
      backgroundMusic.current.currentTime = 0;
      clearInterval(animationFrameId);
    }
  }, [gameOver, gameWon]);

  const initGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let ballX = canvas.width / 2;
    let ballY = canvas.height - 50;
    let ballDX = ballSpeed;
    let ballDY = -ballSpeed;
    let paddleX = (canvas.width - PADDLE_WIDTH) / 2;

    const bricks = Array.from({ length: BRICK_COLUMNS }, () =>
      Array.from({ length: BRICK_ROWS }, () => ({ status: 1 }))
    );

    const drawBall = () => {
      ctx.drawImage(ballImage.current, ballX - BALL_RADIUS, ballY - BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
    };

    const drawPaddle = () => {
      ctx.fillStyle = '#FFC0CB';
      ctx.fillRect(paddleX, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);
    };

    const drawBricks = () => {
      bricks.forEach((col, c) => {
        col.forEach((brick, r) => {
          if (brick.status === 1) {
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING;
            brick.x = brickX;
            brick.y = brickY;
            ctx.fillStyle = `hsl(${r * 50}, 70%, 50%)`;
            ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
          }
        });
      });
    };

    const drawScore = () => {
      ctx.font = "20px pretendard";
      ctx.fillStyle = "white";
      ctx.fillText(`Score: ${score}`, 10, 30);
    };
    
    const drawLives = () => {
      ctx.font = "20px pretendard";
      ctx.fillStyle = "white";
      ctx.fillText("Lives: ", 10, 60);
    
      for (let i = 0; i < lives; i++) {
        ctx.fillStyle = "red"; 
        ctx.fillText("🍎", 80 + i * 30, 60);
      }
    };

    const collisionDetection = () => {
      let allBricksDestroyed = true;
      bricks.forEach((col) =>
        col.forEach((brick) => {
          if (brick.status === 1) {
            allBricksDestroyed = false;
            if (
              ballX > brick.x &&
              ballX < brick.x + BRICK_WIDTH &&
              ballY > brick.y &&
              ballY < brick.y + BRICK_HEIGHT
            ) {
              ballDY = -ballDY;
              brick.status = 0;
              brickHitSound.play();
              setScore(prev => prev + 10);
            }
          }
        })
      );
      if (allBricksDestroyed) {
        setGameWon(true);
      }
    };

    const draw = () => {
      
      if (gameOver || gameWon){
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBricks();
      drawBall();
      drawPaddle();
      drawScore();
      drawLives();
      collisionDetection();

      if (ballX + ballDX > canvas.width - BALL_RADIUS || ballX + ballDX < BALL_RADIUS) {
        ballDX = -ballDX;
      }

      if (ballY + ballDY < BALL_RADIUS) {
        ballDY = -ballDY;
      } else if (ballY + ballDY > canvas.height - BALL_RADIUS) {
        if (ballX > paddleX && ballX < paddleX + PADDLE_WIDTH) {
          ballDY = -ballDY;
        } else {
          setLives((prevLives) => {
            if (prevLives <= 1) {
              setGameOver(true);
              cancelAnimationFrame(animationFrameId);
            }
            return prevLives - 1;
          });
          ballX = canvas.width / 2;
          ballY = canvas.height - 50;
          ballDX = ballSpeed;
          ballDY = -ballSpeed;
        }
      }

      ballX += ballDX;
      ballY += ballDY;

      animationFrameId = requestAnimationFrame(() => draw());
    };

    const mouseMoveHandler = (e) => {
      const canvasRect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - canvasRect.left;
      if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - PADDLE_WIDTH / 2;
      }
    };

    const touchMoveHandler = (e) => {
      e.preventDefault();
      const touchX = e.touches[0].clientX - canvasRef.current.getBoundingClientRect().left;
      if (touchX >= 0 && touchX <= canvasRef.current.width) {
        paddleX = touchX - PADDLE_WIDTH / 2;
      }
    };
    

    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });

    draw();

    return () => {
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  };

  useEffect(() => {
    if (gameStarted && !gameOver && !gameWon) {
      initGame();
    }
  }, [lives, ballSpeed, gameOver, gameWon, gameStarted]);

  const restartGame = () => {
    window.location.reload();
  };

  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
  };

  return (
    <div className="game-container"  style={{ touchAction: 'none' }}>
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="game-canvas" 
        style={{filter: (showInstructions || gameOver || gameWon) ? 'blur(5px)' : 'none', touchAction: 'none'}}
      />
      
      {showInstructions && (
        <div className="game-popup">
          <h2>🍎</h2>
          <p>애플이가 사과를 먹을 수 있게 도와주세요</p>
          <button onClick={startGame}>Game start</button>
        </div>
      )}

      {gameOver && (
        <div className="game-popup">
          <h2>Game Over</h2>
          <p>점수: {score}</p>
          <button onClick={restartGame}>Restart Game</button>
        </div>
      )}

      {gameWon && (
        <div className="game-popup">
          <h2>큐룽</h2>
          <p>점수: {score}</p>
          <button onClick={restartGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default App;