// Dialogue System - Handles UI for NPC dialogue and quiz interactions
const DialogueSystem = (function() {
    // Private properties
    let initialized = false;
    
    // DOM elements
    let dialogueContainer = null;
    let dialogueTitle = null;
    let dialogueContent = null;
    let dialogueOptions = null;
    
    let quizContainer = null;
    let quizTitle = null;
    let quizQuestion = null;
    let quizOptions = null;
    let quizResult = null;
    let quizProgress = null;
    
    let currentNPC = null;
    let currentFoe = null;
    
    // Initialize the dialogue system
    function init() {
        if (initialized) {
            Logger.warning("Dialogue System already initialized");
            return;
        }
        
        try {
            // Create dialogue UI elements
            createDialogueUI();
            
            // Create quiz UI elements
            createQuizUI();
            
            // Set up event listeners
            setupEventListeners();
            
            initialized = true;
            Logger.log("> DIALOGUE SYSTEM INITIALIZED");
            
            return true;
        } catch (e) {
            Logger.error(`Dialogue System initialization failed: ${e.message}`);
            return false;
        }
    }
    
    // Create the dialogue UI elements
    function createDialogueUI() {
        // Create main container
        dialogueContainer = document.createElement('div');
        dialogueContainer.className = 'dialogue-container';
        dialogueContainer.style.display = 'none';
        
        // Create title
        dialogueTitle = document.createElement('div');
        dialogueTitle.className = 'dialogue-title';
        dialogueTitle.textContent = 'DIALOGUE';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'dialogue-close';
        closeButton.textContent = '×';
        closeButton.onclick = hideDialogue;
        
        // Create content area
        dialogueContent = document.createElement('div');
        dialogueContent.className = 'dialogue-content';
        
        // Create options area
        dialogueOptions = document.createElement('div');
        dialogueOptions.className = 'dialogue-options';
        
        // Assemble the UI
        dialogueContainer.appendChild(dialogueTitle);
        dialogueContainer.appendChild(closeButton);
        dialogueContainer.appendChild(dialogueContent);
        dialogueContainer.appendChild(dialogueOptions);
        
        // Add to document
        document.body.appendChild(dialogueContainer);
    }
    
    // Create the quiz UI elements
    function createQuizUI() {
        // Create main container
        quizContainer = document.createElement('div');
        quizContainer.className = 'quiz-container';
        quizContainer.style.display = 'none';
        
        // Create title
        quizTitle = document.createElement('div');
        quizTitle.className = 'quiz-title';
        quizTitle.textContent = 'FOE ENCOUNTER';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'dialogue-close';
        closeButton.textContent = '×';
        closeButton.onclick = hideQuiz;
        
        // Create progress indicator
        quizProgress = document.createElement('div');
        quizProgress.className = 'quiz-progress';
        quizProgress.textContent = 'Foe Message';
        
        // Create question area
        quizQuestion = document.createElement('div');
        quizQuestion.className = 'quiz-question';
        
        // Create options area
        quizOptions = document.createElement('div');
        quizOptions.className = 'quiz-options';
        
        // Create result area
        quizResult = document.createElement('div');
        quizResult.className = 'quiz-result';
        quizResult.style.display = 'none';
        
        // Assemble the UI
        quizContainer.appendChild(quizTitle);
        quizContainer.appendChild(closeButton);
        quizContainer.appendChild(quizProgress);
        quizContainer.appendChild(quizQuestion);
        quizContainer.appendChild(quizOptions);
        quizContainer.appendChild(quizResult);
        
        // Add to document
        document.body.appendChild(quizContainer);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        if (!window.EventSystem) {
            Logger.error("Event System not available for Dialogue System");
            return;
        }
        
        // NPC dialogue events
        EventSystem.on('dialogue.start', handleDialogueStart);
        EventSystem.on('dialogue.end', handleDialogueEnd);
        EventSystem.on('dialogue.response', handleDialogueResponse);
        
        // Quiz events
        EventSystem.on('quiz.start', handleQuizStart);
        EventSystem.on('quiz.end', handleQuizEnd);
        EventSystem.on('quiz.answerResult', handleQuizResult);
        EventSystem.on('quiz.nextQuestion', handleNextQuestion);
    }
    
    // Show the dialogue UI with NPC data
    function showDialogue(npcId, dialogueData) {
        if (!initialized) {
            Logger.error("Cannot show dialogue - system not initialized");
            return;
        }
        
        currentNPC = npcId;
        
        // Set title with NPC name/ID
        dialogueTitle.textContent = `DIALOGUE: ${npcId.toUpperCase()}`;
        
        // Show a random greeting
        if (dialogueData.greetings && dialogueData.greetings.length > 0) {
            const randomGreeting = dialogueData.greetings[Math.floor(Math.random() * dialogueData.greetings.length)];
            dialogueContent.textContent = randomGreeting;
        } else {
            dialogueContent.textContent = "Hello, traveler!";
        }
        
        // Set up dialogue options
        dialogueOptions.innerHTML = '';
        
        // Find the intro conversation
        const introConversation = dialogueData.conversations.find(c => c.id === 'intro') || dialogueData.conversations[0];
        
        if (introConversation && introConversation.responses) {
            introConversation.responses.forEach(response => {
                const button = document.createElement('button');
                button.className = 'dialogue-option';
                button.textContent = response.text;
                
                button.onclick = function() {
                    handleDialogueOptionClick(response.id);
                };
                
                dialogueOptions.appendChild(button);
            });
        }
        
        // Show close option
        const closeOption = document.createElement('button');
        closeOption.className = 'dialogue-option dialogue-close-option';
        closeOption.textContent = "End Conversation";
        closeOption.onclick = hideDialogue;
        dialogueOptions.appendChild(closeOption);
        
        // Show the container
        dialogueContainer.style.display = 'block';
        
        // Emit game pause event
        if (window.EventSystem) {
            EventSystem.emit('game.paused', {
                source: 'dialogue'
            });
        }
    }
    
    // Hide the dialogue UI
    function hideDialogue() {
        if (!dialogueContainer) return;
        
        dialogueContainer.style.display = 'none';
        
        // Let Entity system know the interaction ended
        if (window.EntitySystem && currentNPC) {
            EntitySystem.endInteraction(currentNPC);
        } else if (window.NPCSystem && currentNPC) {
            // Fallback to legacy system
            NPCSystem.endInteraction(currentNPC);
        }
        
        currentNPC = null;
        
        // Emit game resume event
        if (window.EventSystem) {
            EventSystem.emit('game.resumed', {
                source: 'dialogue'
            });
        }
    }
    
    // Handle dialogue option click
    function handleDialogueOptionClick(responseId) {
        // Try EntitySystem first, then fallback to NPCSystem
        if (!currentNPC) return;
        
        let npc = null;
        
        // Try to get NPC from EntitySystem first
        if (window.EntitySystem) {
            npc = EntitySystem.getNPC(currentNPC);
        }
        
        // Fallback to legacy NPCSystem if needed
        if (!npc && window.NPCSystem) {
            npc = NPCSystem.getNPC(currentNPC);
        }
        
        if (!npc || !npc.dialogueData) return;
        
        // Find the corresponding conversation for this response
        const nextConversation = npc.dialogueData.conversations.find(c => c.id === responseId);
        
        if (nextConversation) {
            // Update the dialogue content
            dialogueContent.textContent = nextConversation.text;
            
            // Update response options
            dialogueOptions.innerHTML = '';
            
            if (nextConversation.responses && nextConversation.responses.length > 0) {
                nextConversation.responses.forEach(response => {
                    const button = document.createElement('button');
                    button.className = 'dialogue-option';
                    button.textContent = response.text;
                    
                    button.onclick = function() {
                        handleDialogueOptionClick(response.id);
                    };
                    
                    dialogueOptions.appendChild(button);
                });
            }
            
            // Always show close option
            const closeOption = document.createElement('button');
            closeOption.className = 'dialogue-option dialogue-close-option';
            closeOption.textContent = "End Conversation";
            closeOption.onclick = hideDialogue;
            dialogueOptions.appendChild(closeOption);
        } else if (responseId === 'goodbye') {
            // End the conversation
            hideDialogue();
        }
        
        // Emit dialogue response event
        if (window.EventSystem) {
            EventSystem.emit('dialogue.response', {
                npcId: currentNPC,
                responseId: responseId
            });
        }
    }
    
    // Handle dialogue start event
    function handleDialogueStart(data) {
        if (!data || !data.npcId || !data.dialogueData) return;
        
        showDialogue(data.npcId, data.dialogueData);
    }
    
    // Handle dialogue end event
    function handleDialogueEnd(data) {
        hideDialogue();
    }
    
    // Handle dialogue response event
    function handleDialogueResponse(data) {
        // This is mainly for other systems to listen to dialogue responses
        // The UI is already updated in handleDialogueOptionClick
    }
    
    // Show the quiz UI with foe data
    function showQuiz(foeId, quizData) {
        if (!initialized) {
            Logger.error("Cannot show quiz - system not initialized");
            return;
        }
        
        currentFoe = foeId;
        
        // Set title with foe ID
        quizTitle.textContent = `FOE1`;
        
        // Simplify the progress indicator
        quizProgress.style.display = 'none';
        
        // Set question content
        quizQuestion.textContent = quizData.question || "I am a FOE";
        
        // Clear and set options
        quizOptions.innerHTML = '';
        
        // Only add a close button
        const closeButton = document.createElement('button');
        closeButton.className = 'quiz-option';
        closeButton.textContent = 'Close';
        closeButton.onclick = hideQuiz;
        quizOptions.appendChild(closeButton);
        
        // Show the container
        quizContainer.style.display = 'block';
        
        // Hide result area if it was visible
        quizResult.style.display = 'none';
        
        // Emit game pause event
        if (window.EventSystem) {
            EventSystem.emit('game.paused', {
                source: 'quiz'
            });
        }
    }
    
    // Hide the quiz UI
    function hideQuiz() {
        if (!quizContainer) return;
        
        quizContainer.style.display = 'none';
        currentFoe = null;
        
        // Emit game resume event
        if (window.EventSystem) {
            EventSystem.emit('game.resumed', {
                source: 'quiz'
            });
        }
    }
    
    // Handle quiz start event
    function handleQuizStart(data) {
        if (!data || !data.foeId || !data.quizData) return;
        
        showQuiz(data.foeId, data.quizData);
    }
    
    // Handle quiz end event
    function handleQuizEnd(data) {
        if (!data) return;
        
        // Show final result
        showQuizFinalResult(data);
        
        // Hide quiz UI after delay
        setTimeout(hideQuiz, 3000);
    }
    
    // Handle quiz result event
    function handleQuizResult(data) {
        if (!data) return;
        
        // Show result
        showQuizAnswerResult(data);
    }
    
    // Handle next question event
    function handleNextQuestion(data) {
        if (!data || !data.foeId || !data.quizData) return;
        
        // Show next question
        showQuiz(data.foeId, data.quizData);
    }
    
    // Show quiz answer result
    function showQuizAnswerResult(data) {
        // Show result
        quizResult.innerHTML = '';
        quizResult.className = data.isCorrect ? 'quiz-result correct' : 'quiz-result incorrect';
        
        // Result header
        const resultHeader = document.createElement('div');
        resultHeader.className = 'result-header';
        resultHeader.textContent = data.isCorrect ? 'CORRECT!' : 'INCORRECT!';
        
        // Correct answer
        const correctAnswer = document.createElement('div');
        correctAnswer.className = 'correct-answer';
        correctAnswer.textContent = `Correct answer: ${data.correctAnswer}`;
        
        // Explanation
        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.textContent = data.explanation;
        
        // Score
        const score = document.createElement('div');
        score.className = 'score';
        score.textContent = `Score: ${data.score}/${data.maxScore}`;
        
        // Add to result
        quizResult.appendChild(resultHeader);
        quizResult.appendChild(correctAnswer);
        quizResult.appendChild(explanation);
        quizResult.appendChild(score);
        
        // Show result
        quizResult.style.display = 'block';
        
        // Hide options during result display
        quizOptions.style.display = 'none';
    }
    
    // Show final quiz result
    function showQuizFinalResult(data) {
        // Update UI for final result
        quizQuestion.textContent = data.playerWon ? 
            "You've defeated the foe!" : 
            "You failed the challenge!";
        
        // Show result
        quizResult.innerHTML = '';
        quizResult.className = data.playerWon ? 'quiz-result victory' : 'quiz-result defeat';
        
        // Result header
        const resultHeader = document.createElement('div');
        resultHeader.className = 'result-header';
        resultHeader.textContent = data.playerWon ? 'VICTORY!' : 'DEFEAT!';
        
        // Score
        const score = document.createElement('div');
        score.className = 'score';
        score.textContent = `Final Score: ${data.score}/${data.maxScore}`;
        
        // Add to result
        quizResult.appendChild(resultHeader);
        quizResult.appendChild(score);
        
        // Show result
        quizResult.style.display = 'block';
        
        // Hide options and progress
        quizOptions.style.display = 'none';
        quizProgress.style.display = 'none';
    }
    
    // Public API
    return {
        init: init,
        showDialogue: showDialogue,
        hideDialogue: hideDialogue,
        showQuiz: showQuiz,
        hideQuiz: hideQuiz
    };
})(); 