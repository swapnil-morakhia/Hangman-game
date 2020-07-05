(function () {
    const answer = document.currentScript.getAttribute('word').toUpperCase();
    const gameId = document.currentScript.getAttribute('gameId');

    let guessed = [];
    let incorrect = [];
    let wordStatus = null;
    let chancesLeft = 6;
    updateDisplay(answer);

    const hangman_methods = {
        handleGuess(char) {
            if (!char) throw 'No input.';
            try {
                let patt = /[A-z]/g;
                if (patt.test(char)) {
                    if (guessed.indexOf(char) === -1) {
                        guessed.push(char)
                    } else {
                        throw 'Letter has already been guessed.'
                    }

                    if (answer.indexOf(char) >= 0) {
                        this.guessedWord();
                        this.checkResult();
                    } else if (answer.indexOf(char) === -1) {
                        chancesLeft = chancesLeft - 1;
                        this.addIncorrect(char);
                        this.cycleImage();
                        this.checkResult();
                    }
                }
            } catch (err) {
                throw (err);
            }
        },
        guessedWord() {
            wordStatus = []
            alphabets = answer.toUpperCase().split('')
            for (i = 0; i < alphabets.length; i++) {
                if (guessed.includes(alphabets[i])) {
                    wordStatus.push(alphabets[i])
                } else {
                    wordStatus.push(' _ ')
                }
            }
            wordStatus = wordStatus.join('')
            document.getElementById('wordStatus').innerHTML = wordStatus;
        },
        addIncorrect(char) {
            incorrect.push(char);
            document.getElementById('incorrect-guesses').innerHTML = incorrect;
        },
        cycleImage() {
            const img = document.getElementById('chances-left')
            switch (chancesLeft) {
                default:
                    img.src = '/public/img/6_left.png';
                    break;
                case 6:
                    img.src = '/public/img/6_left.png';
                    break;
                case 5:
                    img.src = '/public/img/5_left.png';
                    break;
                case 4:
                    img.src = '/public/img/4_left.png';
                    break;
                case 3:
                    img.src = '/public/img/3_left.png';
                    break;
                case 2:
                    img.src = '/public/img/2_left.png';
                    break;
                case 1:
                    img.src = '/public/img/1_left.png';
                    break;
                case 0:
                    img.src = '/public/img/0_left.png';
            }
        },
        checkResult() {
            if (wordStatus === answer) {
                document.getElementById('game-results').classList.add('success');
                document.getElementById('game-results').innerHTML = 'You Won!!!';

                submitGameWin(gameId, answer);
            }

            if (chancesLeft == 0) {
                document.getElementById('wordStatus').innerHTML = 'The answer was: ' + answer;
                document.getElementById('game-results').classList.add('failure');
                document.getElementById('game-results').innerHTML = 'You Lost!!!';

                submitGameLoss(gameId, answer);
            }
        }
    };

    const gameForm = document.getElementById('game-form');

    if (gameForm) {
        const errorContainer = document.getElementById("error-container");
        const errorTextElement = errorContainer.getElementsByClassName('text-goes-here')[0];

        gameForm.addEventListener("submit", event => {
            event.preventDefault();

            try {
                errorContainer.hidden = true;

                const input_char = document.getElementById('atext').value;
                hangman_methods.handleGuess(input_char);
                document.getElementById('atext').value = '';

            } catch (e) {
                const message = typeof e === "string" ? e : e.message;
                errorTextElement.textContent = e;
                errorContainer.hidden = false;
            }
        })
    }


})();

// ensures that text input field only takes one capital-letter character.
function validate(input) {
    input.value = input.value.replace(/\W|\d/g, '').substr(0, 1).toUpperCase();
};

function reset(input) {
    input.value = '';
};

// ensures that word guesses are always displayed, etc.
function updateDisplay(answer) {
    document.getElementById('wordStatus').innerHTML = ' _ '.repeat(answer.length);
    document.getElementById("error-container").hidden = true;
};

//submits the game if won
function submitGameWin(gid, w) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/dashboard/game', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        gameId: gid,
        word: w,
        gameWon: true
    }));

    //only redirect once request is complete
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            wait(3000);
            window.location.href = `../dashboard/comments/${gid}`;
        }
    };
}

//submits the game if lost
function submitGameLoss(gid, w) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/dashboard/game', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        gameId: gid,
        word: w,
        gameWon: false
    }));

    //only redirect once request is complete
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            wait(3000);
            window.location.href = `../dashboard/comments/${gid}`;
        }
    };

}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }