var total_attempts = 0;
var total_matched = 0;
var current_dictionary = [];
var current_word = '';
var current_score = 0;
var matched_letters = [];
var game_level = -1;
var last_game_win = false;
var leaderboard_min = -1;

var game_theme1 = 'Theme1';
var game_theme2 = 'Theme2';
var current_theme = game_theme1;
var current_attempt_icon = '&#127815;';
var current_nav_color = '#294944';

getURL = function(){
    // Load the list of words from dictionary.txt
    return 'https://hp-word-guessing-game.herokuapp.com/words?difficulty=' + game_level;
}

getLeaderboardURL = function(){
    return 'https://hp-word-guessing-game.herokuapp.com/';
}

loadApplication = function(document, refresh){
    loadLeaderboard(document);
    loadDictionary(document, true);
}

loadDictionary = function(document, refresh){

    changeGameLevel(-1);
    fetchOfflineRequestsFromIDB();
    
    var url = getURL();

    // Load the dictionary and retrieve a random word
    fetch(url, {
        headers: {
            'Content-Type': 'text/plain',
        }
    }).then(function(response) {
        return response.text();
    }).then(function (data) {
        processDictionary(data);
        if (refresh){
            randomWord(document);
            addClickEvents(document);  
        }
    }).catch(e => console.log(e));

}

resetGame = function(document){

    total_attempts = 0;
    total_matched = 0;

    if (!last_game_win){
        resetScore(document);
    }

    isLastGameAWin(false);
    loadSessionTheme();
    createKeyboard(document);
    
    updateThemeIndex(document);

    displayAttempts(document);

    hideGameStatus(document, 'msgError', true);
    hideGameStatus(document, 'msgWin', true);
    hideGameStatus(document, 'msgGameOver', true);

    switchToWordEntry(false);
    loadSessionScore(document);

}

createKeyboard = function(document){

    var keyboard_div = document.getElementById('keyboard');
    keyboard_div.innerHTML = '';

    // Add capital letters A to Z to the keyboard
    for (let idx = 0; idx < 26; idx++){
        createLetterButton(document, keyboard_div, String.fromCharCode(65 + idx));
    }

    // Allow users to submit word guesses
    createLetterButton(document, keyboard_div, '&#9889;', 'btnWordEntry');      // lightning bolt unicode character

    // Allow users to submit letter guesses
    createLetterButton(document, keyboard_div, 'ABC', 'btnLetterEntry');
}

createLetterButton = function(document, keyboard_div, letter, id){

    let newElement = document.createElement('button'); 
    newElement.setAttribute('class','btnLetter');
    newElement.innerHTML = letter;
    newElement.addEventListener('click', function(){
        clickLetter(document, this);
    });  

    // Set the id if it's available
    if (id){
        newElement.setAttribute('id',id);
    }

    keyboard_div.appendChild(newElement)
}

displayAttempts = function(document){

    var attempts_div = document.getElementById('attempts');
    // Add a space so the section stays in place when user hits 6 attempts
    attempts_div.innerHTML = ' ';

    // Start from 5 since we'll be hiding the icons from right to left
    for (let idx = 5; idx > -1; idx--){
        let newElement = document.createElement('span'); 
        newElement.setAttribute('id','iconGuess' + idx);
        newElement.innerHTML = current_attempt_icon;                   // Grapes unicode character
        attempts_div.appendChild(newElement)
    }
}

hideGameStatus = function(document, id, hide){

    let gameStatus = document.getElementById(id);

    // Hides the You win/Game over messages
    if (hide){   
        gameStatus.classList.add('hide');
    }
    else{
        gameStatus.classList.remove('hide');
    }
    gameStatus.innerHTML = '';
}

loadSessionScore = function(document){
    if (typeof(Storage) !== "undefined") {
        // Scores will be associated to the current browser tab
        if (!sessionStorage.score){
            sessionStorage.score = 0;
        }
        current_score = parseInt(sessionStorage.score);
        document.getElementById('lblScoreValue').innerHTML = current_score;
    } 
    else {
        current_score = 0;
        console.log('Web storage is not supported. Session scores are not available.')
    }
}

resetScore = function(document){

    if (current_score == 0){
        loadSessionScore(document);
    }
    
    // Check if the last winning streak beats the leaderboard minimum
    if (leaderboard_min < 0){
        if (typeof(Storage) !== "undefined") {
            leaderboard_min = parseInt(sessionStorage.leaderboard_min);
        } 
        else {
            console.log('Web storage is not supported. Session scores are not available.')
        }
    }
    if (leaderboard_min > -1 && current_score > leaderboard_min){
        
        var modal = document.getElementById('highScoreModal');
        modal.classList.add('show');
        
        document.getElementById('highScoreNameError').innerHTML = '';
        document.getElementById('highScore').innerHTML = current_score;

    }
    setScore(document, 0);
}

setScore = function(document, score){
 
    current_score = score;
    document.getElementById('lblScoreValue').innerHTML = current_score;

    if (typeof(Storage) !== "undefined") {
        sessionStorage.score = current_score;
    } else {
        console.log('Web storage is not supported. Session scores are not available.')
    }
}

isLastGameAWin = function(status){
 
    // Keep the last game status so we can reset the score if user clicks New Game without finishing a game
    last_game_win = status;

    if (typeof(Storage) !== "undefined") {
        sessionStorage.lastGameStatus = last_game_win;
    } else {
        console.log('Web storage is not supported. Session scores are not available.')
    }
}

addClickEvents = function(document){

    document.getElementById('btnNewGame').onclick = function() {
        randomWord(document);
    };

    document.getElementById('btnSubmit').onclick = function() {
        submitGuess(document);
    };

    // Display the Leaderboard page when user clicks on the Leaderboard button
    document.getElementById('btnLeaderboard').onclick = function() {
        document.getElementById('leaderboardModal').classList.add('show');
        loadLeaderboard(document);
    };
    
    // Display the Options modal when user clicks on the Options button
    var optionsModal = document.getElementById('optionsModal');

    document.getElementById('btnOptions').onclick = function() {
        optionsModal.classList.add('show');
        changeGameLevel(-1);
        document.getElementById('sliderGameLevelValue').innerHTML = game_level;
        document.getElementById('sliderGameLevel').value = game_level;
        document.getElementById('radio' + current_theme).checked = true;
    };

    // Close the Options modal when user clicks on the close button
    document.getElementById('btnOptionsClose').onclick = function() {
        optionsModal.classList.remove('show');
    };

    // Close the Save score modal when user clicks on the close button
    document.getElementById('btnHighScoreModalClose').onclick = function() {
        document.getElementById('highScoreModal').classList.remove('show');
    };

    // Close the Leaderboard modal when user clicks on the close button
    document.getElementById('btnLeaderboardModalClose').onclick = function() {
        document.getElementById('leaderboardModal').classList.remove('show');
    };

    // Add the user to the leaderboard when user clicks on the Save button
    document.getElementById('btnHighScoreModalSave').onclick = function() {
        
        let my_name = document.getElementById('lblHighScoreNameValue').value;

        if (my_name.length > 2){

            // Add the high score to the leaderboard
            let my_score = document.getElementById('highScore').innerHTML;
            postHighScore({'user': my_name, 'score': my_score});
            
            // Hide the modal after saving the score
            document.getElementById('highScoreModal').classList.remove('show');
            loadLeaderboard(document, true);
        }
        else{
            document.getElementById('highScoreNameError').innerHTML = 'Name must have at least 3 characters'
        }
        
    };

    // Set the Game Level based on the slider position
    document.getElementById('sliderGameLevel').onchange = function() {
        changeGameLevel(this.value);
        document.getElementById('sliderGameLevelValue').innerHTML = game_level;

        // Reload the dictionary if the level changes
        loadDictionary(document);
    };

    // Set the Theme based on the radio button that was clicked
    toggleThemeIndex(document, 'radioTheme1', game_theme1, game_theme2);
    toggleThemeIndex(document, 'radioTheme2', game_theme2, game_theme1);
    

    // Close the Options modal when user clicks anywhere outside of it
    window.onclick = function(event) {
        addWindowClickEvents(document);
    }
}

postHighScore = function(data){

    var url = getLeaderboardURL() + 'addscore';
    
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data), 
        headers:{
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Assume that the database is offline if !response.ok and !response.redirected
        if (!response.ok && !response.redirected) {
            throw Error(response.statusText);
        }
        return response.text();
    })
    .then(response => console.log('Success:', JSON.stringify(response)))
    .catch(error => postFetchError(error, url, data));

    function postFetchError(e, request_url, data){
        // Add the score to indexedDB if a database connection cannot be made
        if (e == 'TypeError: Failed to fetch'){
            idb.open('WordPlay').then(db => {
                const offlineObj = db.transaction('offlineRequests', 'readwrite');
                      const offlineStore = offlineObj.objectStore('offlineRequests');
                    offlineStore.put({
                        url: request_url,
                        method: 'POST',
                        data: data
                    });
                  alert('An error occurred. Score will be saved to the server once a network connection is made.');
                  return offlineObj.complete;
            });
        }
        console.log(`Error occurred for POST request. Returned status of ${e}`);
    }

}

/**
* Fetch all offline requests.
*/
fetchOfflineRequestsFromIDB = function() {

    const idbPromise = createIDBObjects();

    idbPromise.onerror = function(e) {
        return;
    };
    
    // Retrieve the offline requests from indexedDB
    idbPromise.then(db => {

        if (!db.objectStoreNames) {
            db.close();
            throw Error("An error occurred while opening the WordPlay IDB");
        }

        const requestsObj = db.transaction('offlineRequests', 'readwrite');
        var requestsStore = requestsObj.objectStore('offlineRequests');

        return requestsStore.getAll();

    })
    .then(requests => fetchOfflineRequests(idbPromise, requests))
    .catch(e => console.log(`fetchOfflineRequestsFromIDB: ${e}`));

    function fetchOfflineRequests (idbPromise, requests) {

        var error, hasError;

        // Loop over the array of requests and call the appropriate fetch method for each request
        if (requests){
            for (let i = 0; i < requests.length; i++){

                let request = requests[i];

                if(request.method == 'POST'){
                    processOfflinePost(request, idbPromise, error);
                }
                if (error){                     // If an error occurs, assume that no database connection can be made and stop looping
                    if (error.length > 0){
                        hasError = true;
                        break;
                    }
                }
                
            }
        }
        if (hasError){
            throw Error(error);
        }

        return;

    }

    function processOfflinePost(request, idbPromise, error){
        fetch(request.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request.data)
        })
        .then(response => {
            // Assume that the database is offline
            if (!response.ok) {
                throw Error(response.statusText);
            }
            // Delete requests from IDB
            deleteFromIDB(idbPromise, request.id);
        })
        .catch(e => requestError(error, e));
    }

    function requestError(error, e) {
        error = (`Error occurred for POST offline request. Returned status of ${e}`);
    }

    function deleteFromIDB(idbPromise, id){
        return idbPromise.then(db => {
            const tx = db.transaction('offlineRequests', 'readwrite');
            tx.objectStore('offlineRequests').delete(parseInt(id));
            return tx.complete;
        });
    }
}


/**
 * Create IDB object stores
 */
createIDBObjects = function(){

    return idb.open('WordPlay', 1, upgradeDb => {

        var offlineStore = upgradeDb.createObjectStore('offlineRequests',{
            keyPath: 'id',
            autoIncrement: true
        });

    });
}

addWindowClickEvents = function(document){

    var modal = document.getElementById('optionsModal');
    if (event.target == modal) {
        modal.classList.remove('show');
    }

    var modal = document.getElementById('leaderboardModal');
    if (event.target == modal) {
        modal.classList.remove('show');
    }
}

toggleThemeIndex = function(document, id, theme1, theme2){
    document.getElementById(id).onclick = function() {
        if (this.checked){
            changeTheme(theme1);
        }
        else{
            changeTheme(theme2);
        }
        updateThemeIndex(document);
    };  
}

changeGameLevel = function(value){

    // Saves the current game level to the session storage 
    value = parseInt(value);

    if (typeof(Storage) !== "undefined") {
        if (value == -1){
            if (!sessionStorage.game_level){
                game_level = 5;
            }
            else{
                game_level = sessionStorage.game_level;
            }
        }
        else{
            game_level = value;
        }
        sessionStorage.game_level = game_level;
    } 
    else {
        if (value == -1){
            game_level = 5;
        }
        else{
            game_level = value;
        }
        console.log('Web storage is not supported. Game levels are not available.')
    }
}

changeTheme = function(value){

    // Saves the current theme to the session storage 
    current_theme = value;

    if (typeof(Storage) !== "undefined") {
        sessionStorage.current_theme = current_theme;
    } 
    else {
        console.log('Web storage is not supported. Session themes are not available.')
    }
}

updateThemeIndex = function(document){

    updateTheme(document);

    if (current_theme == game_theme2){
        current_attempt_icon = '&#11088;';
        current_nav_color = '#294944';

        var submit_color1 = '#4c5688';
        var submit_color2 = '#b1b6d3';

        var modal_color1 = '#bbd2c5';
        var modal_color2 = '#839aa8';
    }
    else{
        current_attempt_icon = '&#127815;'
        current_nav_color = '#aE3767';
        
        var submit_color1 = '#2e6a8f';
        var submit_color2 = '#afd0e5';

        var modal_color1 = '#81d0ea';
        var modal_color2 = '#f5c2d2';
    }
            
    // Set the colors for the nav buttons, submit button, ABC button, game status font, and Options modal
    document.getElementById('btnNewGame').style.background = current_nav_color;
    document.getElementById('btnLeaderboard').style.background = current_nav_color;
    document.getElementById('btnOptions').style.background = current_nav_color;
    document.getElementById('divGameStatus').style.color = current_nav_color;

    updateElementBackground(document.getElementById('btnSubmit'), submit_color1, submit_color2);
    updateElementBackground(document.getElementById('btnLetterEntry'), submit_color1, submit_color2);
    updateElementBackground(document.getElementById('optionsModalContent'), modal_color1, modal_color2);
    updateElementBackground(document.getElementById('highScoreModalContent'), modal_color1, modal_color2);
    updateElementBackground(document.getElementById('leaderboardModalContent'), modal_color1, modal_color2);

    // Update iconGuess if it's already displayed
    for (let idx=0; idx < 6; idx++){
        if (document.getElementById('iconGuess' + idx)){
            document.getElementById('iconGuess' + idx).innerHTML = current_attempt_icon;
        }  
    }
    
}

// Generic code for updating an elements background
updateElementBackground = function(element, color1, color2){
    element.style.background = color1;
    element.style.background = '-webkit-linear-gradient(to bottom, ' + color1 + ' , ' + color2 + ')';
    element.style.background = 'linear-gradient(to bottom, ' + color1 + ', ' + color2 + ')'; 
}

loadSessionTheme = function(){

    if (typeof(Storage) !== "undefined") {
        // Theme will be associated to the current browser tab
        if (!sessionStorage.current_theme){
            sessionStorage.current_theme = game_theme1;
        }
        current_theme = sessionStorage.current_theme;
    } 
    else {
        current_theme = game_theme1;
        console.log('Web storage is not supported. Session themes are not available.')
    }
}

// Theme called from both index.html and leaderboard.html 
updateTheme = function(document){

    if (current_theme == game_theme2){
        var color1 = '#839aa8';
        var color2 = '#bbd2c5'; 
    }
    else{
        var color1 = '#5fc3e4';
        var color2 = '#e55d87'; 
    }
    updateElementBackground(document.body, color1, color2);
}

submitGuess = function(document){

    var current_word_div = document.getElementById('currentWord');

    var user_guess = '';

    // Combine all the letters in the current_word. Make sure they're in uppercase
    current_word_div.childNodes.forEach(element => {
        user_guess += element.value.toUpperCase();
    });

    // If the submitted word matches the current_word, display the success message and disable the keyboard
    if (user_guess == current_word){
        showSuccessMessage(document);   
        disableButton(document.getElementById('btnSubmit'), true);
        disableButton(document.getElementById('btnLetterEntry'), true);
    }
    else{
        // If the submitted word does not match the current_word, hide one guess icon
        document.getElementById('iconGuess' + total_attempts).style.visibility = 'hidden';
        total_attempts += 1;
        displayGameMessage(document, 'msgError', user_guess + ' is not correct', '&#128546;');  

        // If user hits the max number of attempts allowed, display the missed letters and disable the keyboard 
        if (total_attempts == 6){
            showMissedLetters(document);
            disableButton(document.getElementById('btnSubmit'), true);
            disableButton(document.getElementById('btnLetterEntry'), true);
        }
    }
}

disableButton = function(button, disable) {
    button.disabled = disable;
    if (disable){
        button.classList.add('disableAll');
    }
    else{
        button.classList.remove('disableAll');
    }
}

processDictionary = function(data){
    // Convert the new line delimited list to an array of words
    current_dictionary = data.toUpperCase().split('\n');
}

randomWord = function(document){

    var all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Retrieve a random word from the array
    var index = Math.floor(Math.random() * current_dictionary.length); 
    current_word = current_dictionary[index];

    // Split the word into an array of characters
    matched_letters = current_word.split('');

    var current_word_div = document.getElementById('currentWord');
    current_word_div.innerHTML = '';

    resetGame(document);

    // Add an input box for each letter in the current word
    for (let i = 0; i < current_word.length; i++){
        let newElement = document.createElement('input'); 
        newElement.setAttribute('id','currentWordLetter' + i);
        newElement.setAttribute('type','text');
        newElement.setAttribute('maxlength',1);
        newElement.setAttribute('aria-label','currentWordLetter' + i);
        newElement.setAttribute('onkeyup','jumpToNextInput(this,this.value)');
        newElement.disabled = true;
        newElement.innerHTML = '  ';
        // Add support for phrases
        if (!all_letters.includes(current_word[i])){
            total_matched += 1;
            matched_letters[i] = true;
            newElement.value = current_word[i];
            newElement.classList.add('blankTile');
        }
        else{
            matched_letters[i] = false;
        }
        current_word_div.appendChild(newElement)
    }
    
}

clickLetter = function(document, clickedLetter){

    hideGameStatus(document, 'msgError', true);
    
    if (total_attempts == 6){
        return;
    }

    if (total_matched == current_word.length){
        return;
    }

    // Enable the input fields and display the submit button in word entry mode
    if (clickedLetter.id  == 'btnWordEntry') {
        switchToWordEntry(true);
        return;       
    }   
    
    // Disable the input fields and hide the submit button in letter entry mode
    if (clickedLetter.id  == 'btnLetterEntry') {
        switchToWordEntry(false);
        return;       
    }   

    // Disable the letter that the user clicked
    setClickedButtonStyle(clickedLetter);

    let current_guess = clickedLetter.innerHTML;

    if (current_word.includes(current_guess)) {
        // If the letter exists in the word, show them
        showMatchedLetters(document, current_guess);

        // If the user has guessed all letters, display the you win message
        if (total_matched == current_word.length){
            showSuccessMessage(document);
            return;
        }
    }
    else{
        // Otherwise, decrement the guess icons and total_attempts
        document.getElementById('iconGuess' + total_attempts).style.visibility = 'hidden';
        total_attempts += 1;

        // If the user hits the max number of allowed attempts, display the missed letters and the game over message  
        if (total_attempts == 6){
            showMissedLetters(document);
        }
        return;
    }

}

setClickedButtonStyle = function(clickedLetter){
    // Set the style explicitly instead of adding a class so we can distinguish them from other keys when the entire keyboard is disabled
    clickedLetter.style = 'background: #555!important;';
    clickedLetter.style.color = '#484848'
    clickedLetter.style.boxShadow = 'none';
    clickedLetter.style.textShadow = 'none';
    clickedLetter.disabled = true;
}

switchToWordEntry = function(word_entry){

    let current_word_div = document.getElementById('currentWord');
    let idx = 0;

    // Loop over the letters in the current word and enable the fields if the value doesn't match the letter in the current word
    current_word_div.childNodes.forEach(element => {
        if (!matched_letters[idx]){
            element.disabled = !word_entry;
            element.value = '';
        }
        idx += 1;
    });

    toggleAllLetters(document, word_entry);
    
}

toggleAllLetters = function(document, disable){

    let keyboard_div = document.getElementById('keyboard');
    let submit = document.getElementById("btnSubmit");

    if (disable){
        keyboard_div.childNodes.forEach(element => {
            if (element.id  == 'btnLetterEntry'){   
                // Show the Letter Entry key
                element.classList.add('inlineBlock');
                element.classList.remove('hide');
            }
            else if (element.id  == 'btnWordEntry'){
                // Hide the Word Entry key
                element.classList.add('hide');
                element.classList.remove('inlineBlock');
            }
            else{
                // Disable letters A to Z on the keyboard
                disableButton(element,true);
            }
        });
        // Enable and display the word entry submit button
        
        submit.style.visibility = 'visible';
        disableButton(submit, false);
    }
    else{
        keyboard_div.childNodes.forEach(element => {
            if (element.id  == 'btnWordEntry'){
                // Show the Word Entry key
                element.classList.add('inlineBlock');
                element.classList.remove('hide');
            }
            else if (element.id  == 'btnLetterEntry'){
                // Hide the Letter Entry key
                element.classList.add('hide');
                element.classList.remove('inlineBlock');
            }
            else{
                // Enable letters A to Z on the keyboard
                disableButton(element,false);
            }
        });  
        // Hide the word entry submit button 
        submit.style.visibility = 'hidden';
    }

}

jumpToNextInput = function (element, content){

    // Move the focus to the next field after the user enters a letter in the current field
    if (content.length == element.maxLength){

        let letter_id = 'currentWordLetter';
        // Find the current index from the input id
        next = parseInt(element.id.slice(letter_id.length, element.id.length)) + 1;

        var current_word_div = document.getElementById('currentWord');

        if (next < current_word_div.childNodes.length){
            let word_length = current_word_div.childNodes.length;
            // Find the next enabled input field
            while (next < word_length && document.getElementById(letter_id + next).disabled){
                next += 1;
            }
            // Change the focus only if a valid input field is found
            if (next < current_word_div.childNodes.length){
                document.getElementById(letter_id + next).focus();
            }
        }
    }
}

showMatchedLetters = function(document, current_guess){

    // Show the letters in the current word that match the letter submitted by the user
    for (let i = 0; i < current_word.length; i++){
        if (current_word[i] == current_guess){
            document.getElementById('currentWordLetter' + i).value = current_guess;
            matched_letters[i] = true;
            total_matched += 1;
        }
    }

}

displayGameMessage = function(document, id, message, icon){

    // Format the message displayed to the user with icons on both sides
    let status = document.getElementById(id);  
    hideGameStatus(document, id, false);

    let span_message = document.createElement('span'); 
    span_message.setAttribute('class','gameStatusLeftIcon');
    span_message.innerHTML = icon;

    status.appendChild(span_message);
    status.innerHTML += message;

    span_message = document.createElement('span'); 
    span_message.setAttribute('class','gameStatusRightIcon');
    span_message.innerHTML = icon;

    status.appendChild(span_message);

}

showSuccessMessage = function(document){

    // Increment the score by the game level
    setScore(document, current_score + parseInt(game_level));

    isLastGameAWin(true);

    // Display the you win message
    hideGameStatus(document, 'msgError', true);
    displayGameMessage(document, 'msgWin', 'YOU WIN!', '&#127942;');         // Trophy unicode character
}

showMissedLetters = function(document){

    // Reset the score to 0 
    resetScore(document);
    
    // Display the game over message
    hideGameStatus(document, 'msgError', true);
    displayGameMessage(document, 'msgGameOver', 'GAME OVER', '&#128078;');   // Thumbs down unicode character

    for (let i = 0; i < current_word.length; i++){
        
        let currentElement = document.getElementById('currentWordLetter' + i);

        if (currentElement.value.toUpperCase() != current_word[i]){
            currentElement.value = current_word[i];
            // Identify missed letters by displaying them in red font
            currentElement.classList.add('missed');   
        }
    }
}

loadLeaderboard = function(document, hidden){

    var url = getLeaderboardURL() + 'leaderboard';

    // Load the leaderboard from the server
    fetch(url, {
    })
    .then(response => response.json())
    .then(function(scores){
        showLeaderboard(document, scores, hidden);
    }).catch(e => console.log(e));

}

processLeaderboard = function(document, scores){

    // Sort the list by user score, in descending order
    scores.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    // Find the leaderboard min score
    if (scores.length > 0){
        leaderboard_min = scores[9].score;
    }

    if (typeof(Storage) !== "undefined") {
        // Scores will be associated to the current browser tab
        if (!sessionStorage.leaderboard_min){
            sessionStorage.leaderboard_min = leaderboard_min;
        }
    } else {
        console.log('Web storage is not supported. Session scores are not available.')
    }

}

// Display the name and scores from the leaderboard
showLeaderboard = function(document, scores, hidden){

    processLeaderboard(document, scores);

    // Do not display the leaderboard if we're only updating the global variable
    if (hidden){
        return
    }

    document.getElementById('leaderboardMainContent').innerHTML = '';

    let ordered_list = document.createElement('ol');

    ordered_list.setAttribute('class','leaderboardList');

    // Loop over the array of scores object and add them to the display
    // Leaderboard will only display the top 10 scores
    for (let i = 0; i < 10; i++) {

        let element = scores[i];

        let list = document.createElement('li');
        
        let left_column = document.createElement('span'); 
        left_column.setAttribute('class','leaderboardName');
        left_column.innerHTML = element.user;
        list.appendChild(left_column)

        let right_column = document.createElement('span'); 
        right_column.setAttribute('class','leaderboardScore');
        right_column.innerHTML = element.score;
        list.appendChild(right_column)

        ordered_list.appendChild(list)
      }

    document.getElementById('leaderboardMainContent').appendChild(ordered_list)

}
