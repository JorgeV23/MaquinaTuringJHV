/* ============================================
   TURING MACHINE SIMULATOR — LOGIC
   ============================================ */

// ============ DOM References ============
const DOM = {
  inputString: document.getElementById('input-string'),
  tapeAlphabet: document.getElementById('tape-alphabet'),
  initialState: document.getElementById('initial-state'),
  finalStates: document.getElementById('final-states'),
  transitionsBody: document.getElementById('transitions-body'),
  tapeContainer: document.getElementById('tape-container'),
  logContainer: document.getElementById('log-container'),
  definitionContent: document.getElementById('definition-content'),

  // Status displays
  currentState: document.getElementById('current-state'),
  currentSymbol: document.getElementById('current-symbol'),
  stepCount: document.getElementById('step-count'),
  machineStatus: document.getElementById('machine-status'),

  // Cards
  cardState: document.getElementById('card-state'),
  cardSymbol: document.getElementById('card-symbol'),
  cardSteps: document.getElementById('card-steps'),
  cardStatus: document.getElementById('card-status'),

  // Buttons
  btnInit: document.getElementById('btn-init'),
  btnStep: document.getElementById('btn-step'),
  btnAuto: document.getElementById('btn-auto'),
  btnReset: document.getElementById('btn-reset'),
  btnAddTransition: document.getElementById('btn-add-transition'),
  btnLoadExample: document.getElementById('btn-load-example'),

  // Speed
  speedSlider: document.getElementById('speed-slider'),

  // Head indicator
  headIndicator: document.querySelector('.head-indicator'),
};


// ============ Turing Machine Class ============
class TuringMachine {
  constructor() {
    this.tape = [];
    this.headPosition = 0;
    this.currentState = '';
    this.steps = 0;
    this.transitions = {};  // { "state,symbol": { nextState, writeSymbol, direction } }
    this.initialState = '';
    this.finalStates = new Set();
    this.isRunning = false;
    this.isFinished = false;
    this.autoInterval = null;
    this.blankSymbol = 'B';

    // Formal definition components
    this.Q = new Set();      // States
    this.Sigma = new Set();   // Input alphabet
    this.Gamma = new Set();   // Tape alphabet
  }

  /**
   * Initialize the machine with configuration
   */
  init(inputString, initialState, finalStates, transitionsList) {
    // Parse tape
    this.tape = inputString.split('');
    if (this.tape.length === 0) {
      this.tape = [this.blankSymbol];
    }

    // Add padding blanks
    this.tape.unshift(this.blankSymbol);
    this.tape.push(this.blankSymbol);

    this.headPosition = 1; // Start at first real symbol
    this.initialState = initialState;
    this.currentState = initialState;
    this.steps = 0;
    this.isRunning = true;
    this.isFinished = false;

    // Parse final states
    this.finalStates = new Set(
      finalStates.split(',').map(s => s.trim()).filter(Boolean)
    );

    // Parse transitions
    this.transitions = {};
    this.Q = new Set();
    this.Sigma = new Set();
    this.Gamma = new Set();

    // Add blank to Gamma
    this.Gamma.add(this.blankSymbol);

    // Add initial and final states
    this.Q.add(initialState);
    this.finalStates.forEach(s => this.Q.add(s));

    for (const t of transitionsList) {
      const key = `${t.state},${t.readSymbol}`;
      this.transitions[key] = {
        nextState: t.nextState,
        writeSymbol: t.writeSymbol,
        direction: t.direction.toUpperCase(),
      };

      // Collect formal definition sets
      this.Q.add(t.state);
      this.Q.add(t.nextState);
      this.Gamma.add(t.readSymbol);
      this.Gamma.add(t.writeSymbol);

      // Sigma is input alphabet (Gamma minus blank)
      if (t.readSymbol !== this.blankSymbol) this.Sigma.add(t.readSymbol);
      if (t.writeSymbol !== this.blankSymbol) this.Sigma.add(t.writeSymbol);
    }

    // Add tape symbols to sets
    for (const sym of this.tape) {
      this.Gamma.add(sym);
      if (sym !== this.blankSymbol) this.Sigma.add(sym);
    }
  }

  /**
   * Execute one step of the machine
   * @returns {object|null} Step result or null if finished
   */
  step() {
    if (this.isFinished) return null;

    // Read current symbol
    const readSymbol = this.tape[this.headPosition] || this.blankSymbol;

    // Check if in final state
    if (this.finalStates.has(this.currentState)) {
      this.isFinished = true;
      this.isRunning = false;
      return {
        type: 'accepted',
        message: `Aceptada: estado final "${this.currentState}" alcanzado en ${this.steps} pasos.`,
        state: this.currentState,
        symbol: readSymbol,
      };
    }

    // Look up transition
    const key = `${this.currentState},${readSymbol}`;
    const transition = this.transitions[key];

    if (!transition) {
      this.isFinished = true;
      this.isRunning = false;
      return {
        type: 'rejected',
        message: `Detenida: no hay transición definida para δ(${this.currentState}, ${readSymbol}).`,
        state: this.currentState,
        symbol: readSymbol,
      };
    }

    // Store previous state for logging
    const prevState = this.currentState;
    const prevSymbol = readSymbol;

    // Apply transition
    this.tape[this.headPosition] = transition.writeSymbol;
    this.currentState = transition.nextState;
    this.steps++;

    // Move head
    if (transition.direction === 'R') {
      this.headPosition++;
      // Extend tape to the right if needed
      if (this.headPosition >= this.tape.length) {
        this.tape.push(this.blankSymbol);
      }
    } else if (transition.direction === 'L') {
      this.headPosition--;
      // Extend tape to the left if needed
      if (this.headPosition < 0) {
        this.tape.unshift(this.blankSymbol);
        this.headPosition = 0;
      }
    }
    // 'S' (Stay) — head does not move

    return {
      type: 'step',
      step: this.steps,
      prevState,
      prevSymbol,
      nextState: transition.nextState,
      writeSymbol: transition.writeSymbol,
      direction: transition.direction,
      state: this.currentState,
      symbol: this.tape[this.headPosition] || this.blankSymbol,
    };
  }

  /**
   * Get the tape content for display
   */
  getTapeDisplay() {
    return {
      cells: [...this.tape],
      headPosition: this.headPosition,
    };
  }

  /**
   * Get formal definition
   */
  getFormalDefinition() {
    return {
      Q: [...this.Q].sort(),
      Sigma: [...this.Sigma].sort(),
      Gamma: [...this.Gamma].sort(),
      q0: this.initialState,
      F: [...this.finalStates].sort(),
      blank: this.blankSymbol,
    };
  }
}


// ============ UI Controller ============
class UIController {
  constructor() {
    this.machine = new TuringMachine();
    this.autoInterval = null;
    this.transitionRowCount = 0;

    this.bindEvents();
    this.addTransitionRow(); // Start with one empty row
  }

  // ---- Event Binding ----
  bindEvents() {
    DOM.btnInit.addEventListener('click', () => this.initMachine());
    DOM.btnStep.addEventListener('click', () => this.executeStep());
    DOM.btnAuto.addEventListener('click', () => this.toggleAutoExecution());
    DOM.btnReset.addEventListener('click', () => this.resetMachine());
    DOM.btnAddTransition.addEventListener('click', () => this.addTransitionRow());
    DOM.btnLoadExample.addEventListener('click', () => this.loadExample());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === ' ' && !DOM.btnStep.disabled) {
        e.preventDefault();
        this.executeStep();
      }
    });
  }

  // ---- Transition Table Management ----
  addTransitionRow(data = {}) {
    this.transitionRowCount++;
    const row = document.createElement('tr');
    row.dataset.rowId = this.transitionRowCount;

    row.innerHTML = `
      <td><input type="text" class="tr-state" value="${data.state || ''}" placeholder="q0" autocomplete="off"></td>
      <td><input type="text" class="tr-read" value="${data.readSymbol || ''}" placeholder="1" autocomplete="off"></td>
      <td><input type="text" class="tr-next" value="${data.nextState || ''}" placeholder="q1" autocomplete="off"></td>
      <td><input type="text" class="tr-write" value="${data.writeSymbol || ''}" placeholder="X" autocomplete="off"></td>
      <td>
        <select class="tr-dir">
          <option value="R" ${!data.direction || data.direction === 'R' ? 'selected' : ''}>R</option>
          <option value="L" ${data.direction === 'L' ? 'selected' : ''}>L</option>
          <option value="S" ${data.direction === 'S' ? 'selected' : ''}>S</option>
        </select>
      </td>
      <td><button type="button" class="btn-remove-row" title="Eliminar">&times;</button></td>
    `;

    // Remove row handler
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (DOM.transitionsBody.children.length > 1) {
        row.remove();
      }
    });

    DOM.transitionsBody.appendChild(row);

    // Focus the first input of the new row
    if (!data.state) {
      row.querySelector('.tr-state').focus();
    }
  }

  getTransitionsFromTable() {
    const rows = DOM.transitionsBody.querySelectorAll('tr');
    const transitions = [];

    rows.forEach(row => {
      const state = row.querySelector('.tr-state').value.trim();
      const readSymbol = row.querySelector('.tr-read').value.trim();
      const nextState = row.querySelector('.tr-next').value.trim();
      const writeSymbol = row.querySelector('.tr-write').value.trim();
      const direction = row.querySelector('.tr-dir').value;

      if (state && readSymbol && nextState && writeSymbol) {
        transitions.push({ state, readSymbol, nextState, writeSymbol, direction });
      }
    });

    return transitions;
  }

  // ---- Validation Helpers ----
  clearAllValidationErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    document.querySelectorAll('.transition-row-error').forEach(el => el.classList.remove('transition-row-error'));
  }

  showFieldError(inputElement, message) {
    inputElement.classList.add('input-error');
    // Remove existing error msg for this field
    const existingMsg = inputElement.parentElement.querySelector('.field-error-msg');
    if (existingMsg) existingMsg.remove();

    const errorMsg = document.createElement('span');
    errorMsg.className = 'field-error-msg';
    errorMsg.textContent = message;
    inputElement.parentElement.appendChild(errorMsg);

    // Remove error on next input
    const handler = () => {
      inputElement.classList.remove('input-error');
      const msg = inputElement.parentElement.querySelector('.field-error-msg');
      if (msg) msg.remove();
      inputElement.removeEventListener('input', handler);
    };
    inputElement.addEventListener('input', handler);
  }

  /**
   * Validates whether a string is a valid state name.
   * Accepts formats like: q0, q1, qf, q_accept, s0, etc.
   * Must start with a letter and contain only letters, digits, and underscores.
   */
  isValidStateName(name) {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * Validates whether a string is a valid symbol for the tape input.
   * Letters (a-z, A-Z), digits (0-9) are allowed.
   */
  isValidInputString(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  /**
   * Validates whether a symbol is valid for a transition read/write field.
   * Single character: a digit, letter, or recognized symbol (X, Y, B, etc.)
   */
  isValidSymbol(sym) {
    return /^[a-zA-Z0-9]$/.test(sym);
  }

  // ---- Machine Initialization ----
  initMachine() {
    this.clearAllValidationErrors();

    const inputString = DOM.inputString.value.trim();
    const tapeAlphabetStr = DOM.tapeAlphabet.value.trim();
    const initialState = DOM.initialState.value.trim();
    const finalStatesStr = DOM.finalStates.value.trim();
    let hasErrors = false;

    // ---- Validate: Alfabeto de Cinta (Γ) ----
    let tapeAlphabet = new Set();
    if (!tapeAlphabetStr) {
      this.showFieldError(DOM.tapeAlphabet, 'Define el alfabeto de cinta (Ej: 0,1,X,B).');
      hasErrors = true;
    } else {
      const symbols = tapeAlphabetStr.split(',').map(s => s.trim()).filter(Boolean);
      if (symbols.length === 0) {
        this.showFieldError(DOM.tapeAlphabet, 'Ingresa al menos un símbolo separado por comas.');
        hasErrors = true;
      } else {
        const invalidSymbols = symbols.filter(s => !this.isValidSymbol(s));
        if (invalidSymbols.length > 0) {
          this.showFieldError(
            DOM.tapeAlphabet,
            `Símbolo(s) inválido(s): "${invalidSymbols.join(', ')}". Cada símbolo debe ser 1 carácter alfanumérico.`
          );
          hasErrors = true;
        } else {
          tapeAlphabet = new Set(symbols);
          tapeAlphabet.add('B'); // B (blanco) siempre incluido
        }
      }
    }

    // ---- Validate: Cadena Inicial ----
    if (!inputString) {
      this.showFieldError(DOM.inputString, 'La cadena inicial es obligatoria.');
      hasErrors = true;
    } else if (!this.isValidInputString(inputString)) {
      this.showFieldError(DOM.inputString, 'Solo se permiten letras (a-z) y números (0-9).');
      hasErrors = true;
    } else if (tapeAlphabet.size > 0) {
      // Validate each character in the input string against the defined alphabet
      const invalidChars = [];
      for (const ch of inputString) {
        if (!tapeAlphabet.has(ch)) {
          invalidChars.push(ch);
        }
      }
      if (invalidChars.length > 0) {
        const unique = [...new Set(invalidChars)];
        this.showFieldError(
          DOM.inputString,
          `Símbolo(s) "${unique.join(', ')}" no pertenecen al alfabeto de cinta Γ = {${[...tapeAlphabet].join(', ')}}.`
        );
        hasErrors = true;
      }
    }

    // ---- Validate: Estado Inicial ----
    if (!initialState) {
      this.showFieldError(DOM.initialState, 'El estado inicial es obligatorio.');
      hasErrors = true;
    } else if (!this.isValidStateName(initialState)) {
      this.showFieldError(DOM.initialState, 'Estado inválido. Usa formato: q0, q1, s0, etc.');
      hasErrors = true;
    }

    // ---- Validate: Estados Finales ----
    if (!finalStatesStr) {
      this.showFieldError(DOM.finalStates, 'Define al menos un estado final.');
      hasErrors = true;
    } else {
      const finalStatesList = finalStatesStr.split(',').map(s => s.trim()).filter(Boolean);
      if (finalStatesList.length === 0) {
        this.showFieldError(DOM.finalStates, 'Define al menos un estado final.');
        hasErrors = true;
      } else {
        const invalidFinals = finalStatesList.filter(s => !this.isValidStateName(s));
        if (invalidFinals.length > 0) {
          this.showFieldError(
            DOM.finalStates,
            `Estado(s) final(es) inválido(s): "${invalidFinals.join(', ')}". Usa formato: qf, q1, etc.`
          );
          hasErrors = true;
        }
      }
    }

    // ---- Validate: Transitions Table (row by row) ----
    const rows = DOM.transitionsBody.querySelectorAll('tr');
    const transitions = [];
    let hasTransitionErrors = false;
    let allRowsEmpty = true;

    rows.forEach(row => {
      const stateInput = row.querySelector('.tr-state');
      const readInput = row.querySelector('.tr-read');
      const nextInput = row.querySelector('.tr-next');
      const writeInput = row.querySelector('.tr-write');
      const dirSelect = row.querySelector('.tr-dir');

      const state = stateInput.value.trim();
      const readSymbol = readInput.value.trim();
      const nextState = nextInput.value.trim();
      const writeSymbol = writeInput.value.trim();
      const direction = dirSelect.value;

      // Skip completely empty rows
      if (!state && !readSymbol && !nextState && !writeSymbol) {
        return;
      }
      allRowsEmpty = false;

      let rowHasError = false;

      // Validate each field in the row
      if (!state) {
        this.showFieldError(stateInput, 'Requerido');
        rowHasError = true;
      } else if (!this.isValidStateName(state)) {
        this.showFieldError(stateInput, 'Inválido');
        rowHasError = true;
      }

      if (!readSymbol) {
        this.showFieldError(readInput, 'Requerido');
        rowHasError = true;
      } else if (!this.isValidSymbol(readSymbol)) {
        this.showFieldError(readInput, '1 carácter');
        rowHasError = true;
      } else if (tapeAlphabet.size > 0 && !tapeAlphabet.has(readSymbol)) {
        this.showFieldError(readInput, `"${readSymbol}" ∉ Γ`);
        rowHasError = true;
      }

      if (!nextState) {
        this.showFieldError(nextInput, 'Requerido');
        rowHasError = true;
      } else if (!this.isValidStateName(nextState)) {
        this.showFieldError(nextInput, 'Inválido');
        rowHasError = true;
      }

      if (!writeSymbol) {
        this.showFieldError(writeInput, 'Requerido');
        rowHasError = true;
      } else if (!this.isValidSymbol(writeSymbol)) {
        this.showFieldError(writeInput, '1 carácter');
        rowHasError = true;
      } else if (tapeAlphabet.size > 0 && !tapeAlphabet.has(writeSymbol)) {
        this.showFieldError(writeInput, `"${writeSymbol}" ∉ Γ`);
        rowHasError = true;
      }

      if (rowHasError) {
        row.classList.add('transition-row-error');
        hasTransitionErrors = true;
      } else {
        transitions.push({ state, readSymbol, nextState, writeSymbol, direction });
      }
    });

    if (allRowsEmpty) {
      this.showToast('Agrega al menos una transición', 'error');
      hasErrors = true;
    }

    if (hasTransitionErrors) {
      hasErrors = true;
    }

    // ---- Cross-validation: estado inicial debe estar en las transiciones ----
    if (!hasErrors && transitions.length > 0 && initialState) {
      const transitionStates = new Set(transitions.map(t => t.state));
      if (!transitionStates.has(initialState)) {
        this.showFieldError(
          DOM.initialState,
          `"${initialState}" no aparece como estado origen en ninguna transición.`
        );
        hasErrors = true;
      }
    }

    // ---- Stop if there are errors ----
    if (hasErrors) {
      this.showToast('Corrige los errores antes de iniciar', 'error');
      return;
    }

    // Initialize machine
    this.machine.init(inputString, initialState, finalStatesStr, transitions);

    // Update UI
    this.updateTape();
    this.updateStatus();
    this.updateFormalDefinition();
    this.clearLog();
    this.addLogEntry('info', `Máquina inicializada. Cadena: "${inputString}"`);

    // Enable buttons
    DOM.btnStep.disabled = false;
    DOM.btnAuto.disabled = false;
    DOM.btnReset.disabled = false;
    DOM.btnInit.disabled = true;

    // Show head indicator
    DOM.headIndicator.classList.add('visible');

    this.setMachineStatusBadge('running', 'Ejecutando');
    this.showToast('Máquina inicializada correctamente', 'success');
  }

  // ---- Step Execution ----
  executeStep() {
    if (this.machine.isFinished) return;

    const result = this.machine.step();
    if (!result) return;

    if (result.type === 'step') {
      this.addLogEntry('step', result);
    } else if (result.type === 'accepted') {
      this.addLogEntry('accepted', result.message);
      this.onMachineFinished('accepted');
    } else if (result.type === 'rejected') {
      this.addLogEntry('rejected', result.message);
      this.onMachineFinished('rejected');
    }

    this.updateTape();
    this.updateStatus();
  }

  // ---- Auto Execution ----
  toggleAutoExecution() {
    if (this.autoInterval) {
      // Stop
      clearInterval(this.autoInterval);
      this.autoInterval = null;
      DOM.btnAuto.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        Ejecutar Automáticamente
      `;
      DOM.btnStep.disabled = false;
      this.showToast('Ejecución automática detenida', 'info');
    } else {
      // Start
      const speed = 2100 - parseInt(DOM.speedSlider.value); // Invert: high slider = fast = low interval
      this.autoInterval = setInterval(() => {
        if (this.machine.isFinished) {
          clearInterval(this.autoInterval);
          this.autoInterval = null;
          DOM.btnAuto.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            Ejecutar Automáticamente
          `;
          return;
        }
        this.executeStep();
      }, speed);

      DOM.btnAuto.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        Pausar
      `;
      DOM.btnStep.disabled = true;
    }
  }

  // ---- Machine Finished ----
  onMachineFinished(type) {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }

    DOM.btnStep.disabled = true;
    DOM.btnAuto.disabled = true;
    DOM.btnAuto.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      Ejecutar Automáticamente
    `;

    if (type === 'accepted') {
      this.setMachineStatusBadge('accepted', 'Aceptada ✓');
      this.showToast('La máquina alcanzó un estado final', 'success');
    } else {
      this.setMachineStatusBadge('rejected', 'Detenida ✗');
      this.showToast('No se encontró transición válida', 'error');
    }
  }

  // ---- Reset ----
  resetMachine() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }

    this.machine = new TuringMachine();

    // Reset buttons
    DOM.btnInit.disabled = false;
    DOM.btnStep.disabled = true;
    DOM.btnAuto.disabled = true;
    DOM.btnReset.disabled = true;
    DOM.btnAuto.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      Ejecutar Automáticamente
    `;

    // Reset displays
    DOM.currentState.textContent = '—';
    DOM.currentSymbol.textContent = '—';
    DOM.stepCount.textContent = '0';
    this.setMachineStatusBadge('stopped', 'Detenida');

    // Remove card highlights
    document.querySelectorAll('.status-card').forEach(c => c.classList.remove('highlight'));

    // Reset tape
    DOM.tapeContainer.innerHTML = `
      <div class="tape-placeholder">
        <span>Configura la máquina e inicia para ver la cinta</span>
      </div>
    `;

    // Reset log
    this.clearLog();

    // Reset definition
    DOM.definitionContent.innerHTML = '<p class="definition-placeholder">Inicia la máquina para ver la definición formal</p>';

    // Hide head indicator
    DOM.headIndicator.classList.remove('visible');

    this.showToast('Máquina reiniciada', 'info');
  }

  // ---- Tape Rendering ----
  updateTape() {
    const { cells, headPosition } = this.machine.getTapeDisplay();
    DOM.tapeContainer.innerHTML = '';

    cells.forEach((symbol, index) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell';
      cell.textContent = symbol;

      if (index === headPosition) {
        cell.classList.add('active');
      }

      // Index label
      const indexLabel = document.createElement('span');
      indexLabel.className = 'cell-index';
      indexLabel.textContent = index;
      cell.appendChild(indexLabel);

      DOM.tapeContainer.appendChild(cell);
    });

    // Scroll to active cell
    requestAnimationFrame(() => {
      const activeCell = DOM.tapeContainer.querySelector('.tape-cell.active');
      if (activeCell) {
        activeCell.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });

        // Trigger pulse animation
        activeCell.classList.add('written');
        setTimeout(() => activeCell.classList.remove('written'), 400);
      }
    });
  }

  // ---- Status Update ----
  updateStatus() {
    const m = this.machine;
    const readSymbol = m.tape[m.headPosition] || m.blankSymbol;

    DOM.currentState.textContent = m.currentState;
    DOM.currentSymbol.textContent = readSymbol;
    DOM.stepCount.textContent = m.steps;

    // Highlight cards briefly
    [DOM.cardState, DOM.cardSymbol, DOM.cardSteps].forEach(card => {
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 600);
    });
  }

  // ---- Status Badge ----
  setMachineStatusBadge(type, text) {
    const badge = DOM.machineStatus;
    badge.textContent = text;
    badge.className = 'status-value status-badge ' + type;
  }

  // ---- Log ----
  clearLog() {
    DOM.logContainer.innerHTML = '';
  }

  addLogEntry(type, data) {
    // Remove placeholder if present
    const placeholder = DOM.logContainer.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    if (type === 'step') {
      entry.innerHTML = `
        <span class="step-num">[Paso ${data.step}]</span>
        δ(<span class="state-label">${data.prevState}</span>, <span class="symbol-label">${data.prevSymbol}</span>)
        → (<span class="state-label">${data.nextState}</span>, <span class="symbol-label">${data.writeSymbol}</span>, <span class="dir-label">${data.direction}</span>)
      `;
    } else if (type === 'accepted') {
      entry.className += ' final-entry';
      entry.textContent = `✓ ${data}`;
    } else if (type === 'rejected') {
      entry.className += ' error-entry';
      entry.textContent = `✗ ${data}`;
    } else if (type === 'info') {
      entry.style.color = 'var(--accent-blue)';
      entry.textContent = `ℹ ${data}`;
    }

    DOM.logContainer.appendChild(entry);

    // Auto-scroll
    DOM.logContainer.scrollTop = DOM.logContainer.scrollHeight;
  }

  // ---- Formal Definition ----
  updateFormalDefinition() {
    const def = this.machine.getFormalDefinition();

    DOM.definitionContent.innerHTML = `
      <div><span class="def-label">Q</span> = { ${def.Q.join(', ')} }</div>
      <div><span class="def-label">Σ</span> = { ${def.Sigma.join(', ')} }</div>
      <div><span class="def-label">Γ</span> = { ${def.Gamma.join(', ')} }</div>
      <div><span class="def-label">q₀</span> = ${def.q0}</div>
      <div><span class="def-label">B</span> = ${def.blank}</div>
      <div><span class="def-label">F</span> = { ${def.F.join(', ')} }</div>
    `;
  }

  // ---- Load Example ----
  loadExample() {
    // Clear existing transitions
    DOM.transitionsBody.innerHTML = '';
    this.transitionRowCount = 0;

    // Example: Replace all 1s with X
    DOM.inputString.value = '1101101';
    DOM.tapeAlphabet.value = '0, 1, X, B';
    DOM.initialState.value = 'q0';
    DOM.finalStates.value = 'qf';

    const exampleTransitions = [
      { state: 'q0', readSymbol: '1', nextState: 'q0', writeSymbol: 'X', direction: 'R' },
      { state: 'q0', readSymbol: '0', nextState: 'q0', writeSymbol: '0', direction: 'R' },
      { state: 'q0', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'L' },
    ];

    exampleTransitions.forEach(t => this.addTransitionRow(t));

    this.showToast('Ejemplo cargado: Reemplazar 1→X', 'success');
  }

  // ---- Toast Notifications ----
  showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}


// ============ Initialize ============
document.addEventListener('DOMContentLoaded', () => {
  const app = new UIController();
});
