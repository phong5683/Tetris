const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);
let rand = false;
let stats = false;
let paused = false;
let lastN = 0;

let tipsEl;

let tips = ["Move and rotate the falling pieces with the arrow-keys.","Press 'P' to PAUSE", "If you're not epileptic, press 'R'","Create complete rows to destroy them.","The speed of the falling blocks gradually increases as you level up.", "Level up for each 5 rows destroyed"];

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.rowCount+=rowCount;
        player.score += rowCount *12;
        //rowCount *= 2;
         
        if (player.rowCount >=5){
        player.level+=1; 
        player.rowCount-=5; 
                  
        if(dropInterval>player.minDrop){
        dropInterval-=10;
        } 
      
        }
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type)
{
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 7, 0],
            [0, 7, 0],
            [0, 7, 7],
        ];
    } else if (type === 'J') {
        return [
            [0, 6, 0],
            [0, 6, 0],
            [6, 6, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 4, 4],
            [4, 4, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 3, 0],
            [3, 3, 3],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                
                if(rand){
                player.currentColor = colors[Math.round(Math.random()*(colors.length-1))];
                context.fillStyle = player.currentColor;
                    
                    }else{
                player.currentColor = colors[value];      
                context.fillStyle = player.currentColor; 
                        
                
                    }
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
  //console.log(stats);
    context.fillStyle = '#000';
    //context.fillStyle = player.currentColor;

    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
  
  if(stats){
 document.getElementById("stats").style.visibility = "visible";
  }else{  
    document.getElementById("stats").style.visibility = "hidden";

  }
    
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    //changeBackground(player.currentColor);
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function dropToBottom(){
    while (!collide(arena,player)){
        player.pos.y+=1;
    }        
    player.pos.y-=1;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    let r = (pieces.length) * Math.random() | 0;
    if (r !== lastN){
      player.matrix = createPiece(pieces[r]);
      lastN = r;
    }else{
      r = pieces.length * Math.random() | 0;
      player.matrix = createPiece(pieces[r]);
      lastN=r;
    }
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        if (player.score > player.highscore)
        player.highscore = player.score;
        player.score = 0;
        player.level=0;
        dropInterval=player.t;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 850;
let lastTime = 0;
function update(time = 0) {
   
    const deltaTime = time - lastTime;

    if (!paused){

    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;
   
    }
    
    draw();
    requestAnimationFrame(update);
        
}

function updateScore() {
 
  
    document.getElementById('score').innerText = player.score;
        document.getElementById('high-score').innerText = player.highscore;
    document.getElementById('level').innerText = player.level;

  //STATS
   document.getElementById('time').innerText = dropInterval+ "ms"; document.getElementById('lines').innerText = player.score/12 + " linhas";
  
   setInterval(function(){
     let n = Math.round(Math.random()*tips.length);
     if (tipsEl != null){
       tipsEl.setAttribute("class","fadeOut");
       tipsEl.setAttribute("class", " ");
        tipsEl.innerText =  tips[n];
     }
   }, 5555 + Math.round(Math.random()*9999));

}

document.addEventListener('keydown', event => {
  if (event.keyCode === 80){ //PAUSE: P KEY
        paused = !paused;
  } else if (!paused){
    if (event.keyCode === 37) { //MOVE LEFT: LEFT ARROW
        playerMove(-1);
    } else if (event.keyCode === 39) { //MOVE RIGHT: RIGHT ARROW
        playerMove(1);
    } else if (event.keyCode === 40) { //MOVE DOWN: DOWN ARROW
        playerDrop();
    } else if (event.keyCode === 32){ //DROP TO BOTTOM: SPACE KEY
        dropToBottom();  
    } else if (event.keyCode === 81) { //ROTATE LEFT: Q KEY
        playerRotate(-1);
    } else if (event.keyCode === 87) { //ROTATE RIGHT: W KEY
        playerRotate(1);
    } else if (event.keyCode === 82){ //RANDOM COLORS: R KEY
        rand = !rand;
    } else if (event.keyCode === 38){ //ROTATE: UP ARROW
        playerRotate(-1);
    } else if (event.keyCode === 20){
        stats = !stats;
    }
      
    
 }
});

const colors = [
    null,
    '#33B0E0',//lightblue
    '#E8D317',//yellow
    '#9B1284',//purple
    '#00C000',//green
    '#D70010',//red
    '#0029E8',//darkblue
    '#EF7C17',//orange
];

function changeBackground(color) {
   document.body.style.background = color;
}

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    highscore:0,
    t:850,
    minDrop:95,
    rowCount:0,
    level:0,
    currentColor:0,
    color: colors[Math.round(Math.random()*(colors.length-1))],
};

tipsEl = document.getElementById("tips");


playerReset();
updateScore();
update();
