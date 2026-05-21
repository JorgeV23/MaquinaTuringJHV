
// ============ Referencias del DOM ============
function irSimulador() {
  document.querySelector('.app-container')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============ Navbar fija al hacer scroll ============
(function () {
  const stickyNav = document.getElementById('sticky-nav');
  const header = document.querySelector('.header');
  if (!stickyNav || !header) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        stickyNav.classList.remove('visible');
      } else {
        stickyNav.classList.add('visible');
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(header);
})();

const DOM = {
  inputString: document.getElementById('input-string'),
  tapeAlphabet: document.getElementById('tape-alphabet'),
  initialState: document.getElementById('initial-state'),
  finalStates: document.getElementById('final-states'),
  transitionsBody: document.getElementById('transitions-body'),
  tapeContainer: document.getElementById('tape-container'),
  logContainer: document.getElementById('log-container'),
  definitionContent: document.getElementById('definition-content'),

  // Indicadores de estado
  currentState: document.getElementById('current-state'),
  currentSymbol: document.getElementById('current-symbol'),
  stepCount: document.getElementById('step-count'),
  machineStatus: document.getElementById('machine-status'),

  // Tarjetas
  cardState: document.getElementById('card-state'),
  cardSymbol: document.getElementById('card-symbol'),
  cardSteps: document.getElementById('card-steps'),
  cardStatus: document.getElementById('card-status'),

  // Botones
  btnInit: document.getElementById('btn-init'),
  btnStep: document.getElementById('btn-step'),
  btnAuto: document.getElementById('btn-auto'),
  btnReset: document.getElementById('btn-reset'),
  btnAddTransition: document.getElementById('btn-add-transition'),
  btnLoadExample: document.getElementById('btn-load-example'),

  // Velocidad
  speedSlider: document.getElementById('speed-slider'),

  // Head & direction trackers
  headTracker: document.getElementById('head-tracker'),
  directionTracker: document.getElementById('direction-tracker'),
  directionArrow: document.getElementById('direction-arrow'),

  // Menu de ejemplos
  exampleDropdown: document.getElementById('example-dropdown'),
  exampleMenu: document.getElementById('example-menu'),
};


// ============ Clase Maquina de Turing ============
class TuringMachine {
  constructor() {
    this.tape = [];
    this.headPosition = 0;
    this.currentState = '';
    this.steps = 0;
    this.transitions = {};  // { "estado,simbolo": { nextState, writeSymbol, direction } }
    this.initialState = '';
    this.finalStates = new Set();
    this.isRunning = false;
    this.isFinished = false;
    this.autoInterval = null;
    this.blankSymbol = 'B';

    // Componentes de la definicion formal
    this.Q = new Set();      // Estados
    this.Sigma = new Set();   // Alfabeto de entrada
    this.Gamma = new Set();   // Alfabeto de cinta
  }

  /**
   * Inicializar la maquina con la configuracion dada
   */
  init(inputString, initialState, finalStates, transitionsList) {
    // Procesar cinta
    this.tape = inputString.split('');
    if (this.tape.length === 0) {
      this.tape = [this.blankSymbol];
    }

    // Agregar blancos de relleno
    this.tape.unshift(this.blankSymbol);
    this.tape.push(this.blankSymbol);

    this.headPosition = 1; // Iniciar en el primer simbolo real
    this.initialState = initialState;
    this.currentState = initialState;
    this.steps = 0;
    this.isRunning = true;
    this.isFinished = false;

    // Procesar estados finales
    this.finalStates = new Set(
      finalStates.split(',').map(s => s.trim()).filter(Boolean)
    );

    // Procesar transiciones
    this.transitions = {};
    this.Q = new Set();
    this.Sigma = new Set();
    this.Gamma = new Set();

    // Agregar blanco a Gamma
    this.Gamma.add(this.blankSymbol);

    // Agregar estados inicial y finales
    this.Q.add(initialState);
    this.finalStates.forEach(s => this.Q.add(s));

    for (const t of transitionsList) {
      const key = `${t.state},${t.readSymbol}`;
      this.transitions[key] = {
        nextState: t.nextState,
        writeSymbol: t.writeSymbol,
        direction: t.direction.toUpperCase(),
      };

      // Recopilar conjuntos de la definicion formal
      this.Q.add(t.state);
      this.Q.add(t.nextState);
      this.Gamma.add(t.readSymbol);
      this.Gamma.add(t.writeSymbol);

      // Sigma es el alfabeto de entrada (Gamma menos blanco)
      if (t.readSymbol !== this.blankSymbol) this.Sigma.add(t.readSymbol);
      if (t.writeSymbol !== this.blankSymbol) this.Sigma.add(t.writeSymbol);
    }

    // Agregar simbolos de la cinta a los conjuntos
    for (const sym of this.tape) {
      this.Gamma.add(sym);
      if (sym !== this.blankSymbol) this.Sigma.add(sym);
    }
  }

  /**
   * Ejecutar un paso de la maquina
   * @returns {object|null} Resultado del paso o null si termino
   */
  step() {
    if (this.isFinished) return null;

    // Leer simbolo actual
    const readSymbol = this.tape[this.headPosition] || this.blankSymbol;

    // Verificar si esta en estado final
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

    // Buscar transicion
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

    // Guardar estado anterior para el registro
    const prevState = this.currentState;
    const prevSymbol = readSymbol;

    // Aplicar transicion
    this.tape[this.headPosition] = transition.writeSymbol;
    this.currentState = transition.nextState;
    this.steps++;

    // Mover cabezal
    if (transition.direction === 'D') {
      this.headPosition++;
      // Extender cinta a la derecha si es necesario
      if (this.headPosition >= this.tape.length) {
        this.tape.push(this.blankSymbol);
      }
    } else if (transition.direction === 'I') {
      this.headPosition--;
      // Extender cinta a la izquierda si es necesario
      if (this.headPosition < 0) {
        this.tape.unshift(this.blankSymbol);
        this.headPosition = 0;
      }
    }
    // 'S' (Sin movimiento) - el cabezal no se mueve

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
   * Obtener contenido de la cinta para mostrar
   */
  getTapeDisplay() {
    return {
      cells: [...this.tape],
      headPosition: this.headPosition,
    };
  }

  /**
   * Obtener definicion formal
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


// ============ Controlador de Interfaz ============
class UIController {
  constructor() {
    this.machine = new TuringMachine();
    this.autoInterval = null;
    this.transitionRowCount = 0;
    this.lastDirection = null; // Track last head movement direction

    this.bindEvents();
    this.addTransitionRow(); // Iniciar con una fila vacia
  }

  // ---- Enlace de Eventos ----
  bindEvents() {
    DOM.btnInit.addEventListener('click', () => this.initMachine());
    DOM.btnStep.addEventListener('click', () => this.executeStep());
    DOM.btnAuto.addEventListener('click', () => this.toggleAutoExecution());
    DOM.btnReset.addEventListener('click', () => this.resetMachine());
    DOM.btnAddTransition.addEventListener('click', () => this.addTransitionRow());

    // Boton de ejemplos: abrir/cerrar menu desplegable
    DOM.btnLoadExample.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.exampleDropdown.classList.toggle('open');
    });

    // Opciones del menu de ejemplos
    DOM.exampleMenu.addEventListener('click', (e) => {
      const option = e.target.closest('.example-option');
      if (!option) return;
      const exampleId = option.dataset.example;
      this.loadExample(parseInt(exampleId));
      DOM.exampleDropdown.classList.remove('open');
    });

    // Cerrar menu al hacer clic fuera
    document.addEventListener('click', () => {
      DOM.exampleDropdown.classList.remove('open');
    });

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === ' ' && !DOM.btnStep.disabled) {
        e.preventDefault();
        this.executeStep();
      }
    });
  }

  // ---- Gestion de la Tabla de Transiciones ----
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
          <option value="D" ${!data.direction || data.direction === 'D' ? 'selected' : ''}>D</option>
          <option value="I" ${data.direction === 'I' ? 'selected' : ''}>I</option>
          <option value="S" ${data.direction === 'S' ? 'selected' : ''}>S</option>
        </select>
      </td>
      <td><button type="button" class="btn-remove-row" title="Eliminar">&times;</button></td>
    `;

    // Manejador para eliminar fila
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (DOM.transitionsBody.children.length > 1) {
        row.remove();
      }
    });

    DOM.transitionsBody.appendChild(row);

    // Enfocar el primer input de la nueva fila
    if (!data.state) {
      row.querySelector('.tr-state').focus({ preventScroll: true });
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

  // ---- Ayudantes de Validacion ----
  clearAllValidationErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    document.querySelectorAll('.transition-row-error').forEach(el => el.classList.remove('transition-row-error'));
  }

  showFieldError(inputElement, message) {
    inputElement.classList.add('input-error');
    // Eliminar mensaje de error existente para este campo
    const existingMsg = inputElement.parentElement.querySelector('.field-error-msg');
    if (existingMsg) existingMsg.remove();

    const errorMsg = document.createElement('span');
    errorMsg.className = 'field-error-msg';
    errorMsg.textContent = message;
    inputElement.parentElement.appendChild(errorMsg);

    // Eliminar error al siguiente cambio de input
    const handler = () => {
      inputElement.classList.remove('input-error');
      const msg = inputElement.parentElement.querySelector('.field-error-msg');
      if (msg) msg.remove();
      inputElement.removeEventListener('input', handler);
    };
    inputElement.addEventListener('input', handler);
  }

  /**
   * Valida si una cadena es un nombre de estado valido.
   * Acepta formatos como: q0, q1, qf, q_accept, s0, etc.
   * Debe iniciar con letra y contener solo letras, digitos y guiones bajos.
   */
  isValidStateName(name) {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * Valida si una cadena es valida para la entrada de la cinta.
   * Se permiten letras (a-z, A-Z) y digitos (0-9).
   */
  isValidInputString(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  /**
   * Valida si un simbolo es valido para un campo de lectura/escritura.
   * Un solo caracter: digito, letra o simbolo reconocido (X, Y, B, etc.)
   */
  isValidSymbol(sym) {
    return /^[a-zA-Z0-9]$/.test(sym);
  }

  // ---- Inicializacion de la Maquina ----
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
      // Validar cada caracter de la cadena contra el alfabeto definido
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

      // Saltar filas completamente vacias
      if (!state && !readSymbol && !nextState && !writeSymbol) {
        return;
      }
      allRowsEmpty = false;

      let rowHasError = false;

      // Validar cada campo de la fila
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

    // Inicializar maquina
    this.machine.init(inputString, initialState, finalStatesStr, transitions);

    // Actualizar interfaz
    this.updateTape();
    this.updateStatus();
    this.updateFormalDefinition();
    this.clearLog();
    this.addLogEntry('info', `Máquina inicializada. Cadena: "${inputString}"`);

    // Scroll automático hacia el simulador
    document.querySelector('.app-container')
      .scrollIntoView({ behavior: 'smooth', block: 'start' });


    // Habilitar botones
    DOM.btnStep.disabled = false;
    DOM.btnAuto.disabled = false;
    DOM.btnReset.disabled = false;
    DOM.btnInit.disabled = true;

    // Mostrar indicadores del cabezal
    this.lastDirection = null;
    DOM.headTracker.classList.add('visible');

    this.setMachineStatusBadge('running', 'Ejecutando');
    this.showToast('Máquina inicializada correctamente', 'success');
  }

  // ---- Ejecucion por Paso ----
  executeStep() {
    if (this.machine.isFinished) return;

    const result = this.machine.step();
    if (!result) return;

    if (result.type === 'step') {
      this.lastDirection = result.direction; // 'R', 'L', or 'S'
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

  // ---- Ejecucion Automatica ----
  toggleAutoExecution() {
    if (this.autoInterval) {
      // Detener
      clearInterval(this.autoInterval);
      this.autoInterval = null;
      DOM.btnAuto.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        Ejecutar Automáticamente
      `;
      DOM.btnStep.disabled = false;
      this.showToast('Ejecución automática detenida', 'info');
    } else {
      // Iniciar
      const speed = 2100 - parseInt(DOM.speedSlider.value); // Invertir: slider alto = rapido = intervalo bajo
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

  // ---- Maquina Finalizada ----
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

  // ---- Reiniciar ----
  resetMachine() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }

    this.machine = new TuringMachine();

    // Reiniciar botones
    DOM.btnInit.disabled = false;
    DOM.btnStep.disabled = true;
    DOM.btnAuto.disabled = true;
    DOM.btnReset.disabled = true;
    DOM.btnAuto.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      Ejecutar Automáticamente
    `;

    // Reiniciar indicadores
    DOM.currentState.textContent = '—';
    DOM.currentSymbol.textContent = '—';
    DOM.stepCount.textContent = '0';
    this.setMachineStatusBadge('stopped', 'Detenida');

    // Quitar resaltado de tarjetas
    document.querySelectorAll('.status-card').forEach(c => c.classList.remove('highlight'));

    // Reiniciar cinta
    DOM.tapeContainer.innerHTML = `
      <div class="tape-placeholder">
        <span>Configura la máquina e inicia para ver la cinta</span>
      </div>
    `;

    // Reiniciar registro
    this.clearLog();

    // Reiniciar definicion
    DOM.definitionContent.innerHTML = '<p class="definition-placeholder">Inicia la máquina para ver la definición formal</p>';

    // Ocultar indicadores del cabezal
    DOM.headTracker.classList.remove('visible');
    DOM.directionTracker.classList.remove('visible');
    this.lastDirection = null;

    this.showToast('Máquina reiniciada', 'info');
  }

  // ---- Renderizado de la Cinta ----
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

      // Etiqueta de indice
      const indexLabel = document.createElement('span');
      indexLabel.className = 'cell-index';
      indexLabel.textContent = index;
      cell.appendChild(indexLabel);

      DOM.tapeContainer.appendChild(cell);
    });

    // Desplazar hacia la celda activa y position trackers
    requestAnimationFrame(() => {
      const activeCell = DOM.tapeContainer.querySelector('.tape-cell.active');
      if (activeCell) {
        activeCell.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });

        // Activar animacion de pulso
        activeCell.classList.add('written');
        setTimeout(() => activeCell.classList.remove('written'), 400);

        // Position head tracker above active cell
        this.positionTrackers(activeCell);
      }
    });
  }

  /**
   * Posicionar los indicadores (cabezal y dirección) sobre la celda activa
   */
  positionTrackers(activeCell) {
    const viewport = activeCell.closest('.tape-viewport');
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    const cellRect = activeCell.getBoundingClientRect();

    // Center of the active cell relative to the viewport
    const cellCenterX = cellRect.left + cellRect.width / 2 - viewportRect.left;

    // Position the head tracker (above)
    const headTracker = DOM.headTracker;
    const headWidth = headTracker.offsetWidth;
    headTracker.style.left = (cellCenterX - headWidth / 2) + 'px';

    // Position the direction tracker (below)
    const dirTracker = DOM.directionTracker;
    const dirWidth = dirTracker.offsetWidth;
    dirTracker.style.left = (cellCenterX - dirWidth / 2) + 'px';

    // Update direction arrow
    const arrow = DOM.directionArrow;
    arrow.classList.remove('dir-left', 'dir-right', 'dir-stay');

    if (this.lastDirection === 'I') {
      arrow.classList.add('dir-left');
      dirTracker.classList.add('visible');
    } else if (this.lastDirection === 'D') {
      arrow.classList.add('dir-right');
      dirTracker.classList.add('visible');
    } else if (this.lastDirection === 'S') {
      // Show a "stay" indicator — use a dot/pause icon approach
      arrow.classList.add('dir-stay');
      dirTracker.classList.add('visible');
    }
  }

  // ---- Actualizacion de Estado ----
  updateStatus() {
    const m = this.machine;
    const readSymbol = m.tape[m.headPosition] || m.blankSymbol;

    DOM.currentState.textContent = m.currentState;
    DOM.currentSymbol.textContent = readSymbol;
    DOM.stepCount.textContent = m.steps;

    // Resaltar tarjetas brevemente
    [DOM.cardState, DOM.cardSymbol, DOM.cardSteps].forEach(card => {
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 600);
    });
  }

  // ---- Insignia de Estado ----
  setMachineStatusBadge(type, text) {
    const badge = DOM.machineStatus;
    badge.textContent = text;
    badge.className = 'status-value status-badge ' + type;
  }

  // ---- Registro ----
  clearLog() {
    DOM.logContainer.innerHTML = '';
  }

  addLogEntry(type, data) {
    // Eliminar placeholder si existe
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

    // Desplazamiento automatico
    DOM.logContainer.scrollTop = DOM.logContainer.scrollHeight;
  }

  // ---- Definicion Formal ----
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

  // ---- Cargar Ejemplo ----
  loadExample(id) {
    // Limpiar transiciones existentes
    DOM.transitionsBody.innerHTML = '';
    this.transitionRowCount = 0;

    if (id === 1) {
      // Ejemplo 1: Reemplazar todos los 1 por X
      DOM.inputString.value = '1101101';
      DOM.tapeAlphabet.value = '0, 1, X, B';
      DOM.initialState.value = 'q0';
      DOM.finalStates.value = 'qf';
      const transitions = [
        { state: 'q0', readSymbol: '1', nextState: 'q0', writeSymbol: 'X', direction: 'D' },
        { state: 'q0', readSymbol: '0', nextState: 'q0', writeSymbol: '0', direction: 'D' },
        { state: 'q0', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'I' },
      ];
      transitions.forEach(t => this.addTransitionRow(t));
      this.showToast('Ejemplo cargado: Reemplazar 1 por X', 'success');

    } else if (id === 2) {
      // Ejemplo 2: Invertir bits (0 a 1, 1 a 0)
      DOM.inputString.value = '110100';
      DOM.tapeAlphabet.value = '0, 1, B';
      DOM.initialState.value = 'q0';
      DOM.finalStates.value = 'qf';
      const transitions = [
        { state: 'q0', readSymbol: '0', nextState: 'q0', writeSymbol: '1', direction: 'D' },
        { state: 'q0', readSymbol: '1', nextState: 'q0', writeSymbol: '0', direction: 'D' },
        { state: 'q0', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'I' },
      ];
      transitions.forEach(t => this.addTransitionRow(t));
      this.showToast('Ejemplo cargado: Invertir bits', 'success');

    } else if (id === 3) {
      // Ejemplo 3: Agregar 1 al final de la cadena
      DOM.inputString.value = '1010';
      DOM.tapeAlphabet.value = '0, 1, B';
      DOM.initialState.value = 'q0';
      DOM.finalStates.value = 'qf';
      const transitions = [
        { state: 'q0', readSymbol: '0', nextState: 'q0', writeSymbol: '0', direction: 'D' },
        { state: 'q0', readSymbol: '1', nextState: 'q0', writeSymbol: '1', direction: 'D' },
        { state: 'q0', readSymbol: 'B', nextState: 'qf', writeSymbol: '1', direction: 'S' },
      ];
      transitions.forEach(t => this.addTransitionRow(t));
      this.showToast('Ejemplo cargado: Agregar 1 al final', 'success');

    } else if (id === 4) {
      // ============================================================
      // Ejemplo 4: Verificar palíndromo binario
      // ============================================================
      // Estrategia:
      //   q0 — Leer extremo izquierdo: marcar 0→X o 1→Y, saltar ya-marcados
      //   q1 — Vio 0, ir a la derecha buscando extremo derecho
      //   q2 — Vio 1, ir a la derecha buscando extremo derecho
      //   q3 — Vio 0, retroceder desde B buscando el último sin marcar (debe ser 0)
      //   q4 — Vio 1, retroceder desde B buscando el último sin marcar (debe ser 1)
      //   q5 — Coincidencia OK, regresar al extremo izquierdo
      //   qf — Aceptar (es palíndromo)
      //
      // Rechazo: si q3 encuentra 1, o q4 encuentra 0 → sin transición → rechaza
      // Caso impar: si q3/q4 llegan a B sin encontrar símbolo → elemento medio, aceptar
      //
      // Alfabeto de cinta: 0, 1, X (0 revisado), Y (1 revisado), B (blanco)
      // Cadena de prueba: "1001" (palíndromo → acepta)
      // Pruebas válidas:   0110, 1001, 10101
      // Pruebas inválidas: 1100, 1010
      // ============================================================
      DOM.inputString.value = '1001';
      DOM.tapeAlphabet.value = '0, 1, X, Y, B';
      DOM.initialState.value = 'q0';
      DOM.finalStates.value = 'qf';
      const transitions = [
        // q0: Leer extremo izquierdo sin marcar
        { state: 'q0', readSymbol: '0', nextState: 'q1', writeSymbol: 'X', direction: 'D' },
        { state: 'q0', readSymbol: '1', nextState: 'q2', writeSymbol: 'Y', direction: 'D' },
        { state: 'q0', readSymbol: 'X', nextState: 'q0', writeSymbol: 'X', direction: 'D' },
        { state: 'q0', readSymbol: 'Y', nextState: 'q0', writeSymbol: 'Y', direction: 'D' },
        { state: 'q0', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'S' },

        // q1: Vio 0 a la izquierda, avanzar hasta el final derecho
        { state: 'q1', readSymbol: '0', nextState: 'q1', writeSymbol: '0', direction: 'D' },
        { state: 'q1', readSymbol: '1', nextState: 'q1', writeSymbol: '1', direction: 'D' },
        { state: 'q1', readSymbol: 'X', nextState: 'q1', writeSymbol: 'X', direction: 'D' },
        { state: 'q1', readSymbol: 'Y', nextState: 'q1', writeSymbol: 'Y', direction: 'D' },
        { state: 'q1', readSymbol: 'B', nextState: 'q3', writeSymbol: 'B', direction: 'I' },

        // q2: Vio 1 a la izquierda, avanzar hasta el final derecho
        { state: 'q2', readSymbol: '0', nextState: 'q2', writeSymbol: '0', direction: 'D' },
        { state: 'q2', readSymbol: '1', nextState: 'q2', writeSymbol: '1', direction: 'D' },
        { state: 'q2', readSymbol: 'X', nextState: 'q2', writeSymbol: 'X', direction: 'D' },
        { state: 'q2', readSymbol: 'Y', nextState: 'q2', writeSymbol: 'Y', direction: 'D' },
        { state: 'q2', readSymbol: 'B', nextState: 'q4', writeSymbol: 'B', direction: 'I' },

        // q3: Vio 0, buscar último sin marcar (debe ser 0 para coincidir)
        { state: 'q3', readSymbol: 'X', nextState: 'q3', writeSymbol: 'X', direction: 'I' },
        { state: 'q3', readSymbol: 'Y', nextState: 'q3', writeSymbol: 'Y', direction: 'I' },
        { state: 'q3', readSymbol: '0', nextState: 'q5', writeSymbol: 'X', direction: 'I' },
        // q3 + 1 → sin transición → RECHAZO (no coincide)
        { state: 'q3', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'S' },

        // q4: Vio 1, buscar último sin marcar (debe ser 1 para coincidir)
        { state: 'q4', readSymbol: 'X', nextState: 'q4', writeSymbol: 'X', direction: 'I' },
        { state: 'q4', readSymbol: 'Y', nextState: 'q4', writeSymbol: 'Y', direction: 'I' },
        { state: 'q4', readSymbol: '1', nextState: 'q5', writeSymbol: 'Y', direction: 'I' },
        // q4 + 0 → sin transición → RECHAZO (no coincide)
        { state: 'q4', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'S' },

        // q5: Regresar al extremo izquierdo
        { state: 'q5', readSymbol: '0', nextState: 'q5', writeSymbol: '0', direction: 'I' },
        { state: 'q5', readSymbol: '1', nextState: 'q5', writeSymbol: '1', direction: 'I' },
        { state: 'q5', readSymbol: 'X', nextState: 'q5', writeSymbol: 'X', direction: 'I' },
        { state: 'q5', readSymbol: 'Y', nextState: 'q5', writeSymbol: 'Y', direction: 'I' },
        { state: 'q5', readSymbol: 'B', nextState: 'q0', writeSymbol: 'B', direction: 'D' },
      ];
      transitions.forEach(t => this.addTransitionRow(t));
      this.showToast('Ejemplo cargado: Verificar palíndromo', 'success');

    } else if (id === 5) {
      // ============================================================
      // Ejemplo 5: Igual cantidad de 0 y 1
      // ============================================================
      // Estrategia:
      //   q0 — Buscar primer símbolo sin marcar (0 o 1)
      //        Si 0 → marcar X, ir a q1 (buscar un 1)
      //        Si 1 → marcar X, ir a q2 (buscar un 0)
      //        Si X → saltar
      //        Si B → todos emparejados → aceptar
      //   q1 — Vio 0, buscar un 1 sin marcar hacia la derecha
      //        Si 1 → marcar X, ir a q3 (regresar)
      //        Si 0/X → saltar
      //        Si B → sin transición → RECHAZO (sobran 0s)
      //   q2 — Vio 1, buscar un 0 sin marcar hacia la derecha
      //        Si 0 → marcar X, ir a q3 (regresar)
      //        Si 1/X → saltar
      //        Si B → sin transición → RECHAZO (sobran 1s)
      //   q3 — Regresar al inicio
      //   qf — Aceptar
      //
      // Alfabeto de cinta: 0, 1, X (marcado), B (blanco)
      // Cadena de prueba: "0011" (igual cantidad → acepta)
      // Pruebas válidas:   01, 0011, 1010
      // Pruebas inválidas: 1110, 0001
      // ============================================================
      DOM.inputString.value = '0011';
      DOM.tapeAlphabet.value = '0, 1, X, B';
      DOM.initialState.value = 'q0';
      DOM.finalStates.value = 'qf';
      const transitions = [
        // q0: Buscar primer símbolo sin marcar
        { state: 'q0', readSymbol: '0', nextState: 'q1', writeSymbol: 'X', direction: 'D' },
        { state: 'q0', readSymbol: '1', nextState: 'q2', writeSymbol: 'X', direction: 'D' },
        { state: 'q0', readSymbol: 'X', nextState: 'q0', writeSymbol: 'X', direction: 'D' },
        { state: 'q0', readSymbol: 'B', nextState: 'qf', writeSymbol: 'B', direction: 'S' },

        // q1: Vio 0, buscar un 1 para emparejar
        { state: 'q1', readSymbol: '0', nextState: 'q1', writeSymbol: '0', direction: 'D' },
        { state: 'q1', readSymbol: '1', nextState: 'q3', writeSymbol: 'X', direction: 'I' },
        { state: 'q1', readSymbol: 'X', nextState: 'q1', writeSymbol: 'X', direction: 'D' },
        // q1 + B → sin transición → RECHAZO (sobran 0s)

        // q2: Vio 1, buscar un 0 para emparejar
        { state: 'q2', readSymbol: '0', nextState: 'q3', writeSymbol: 'X', direction: 'I' },
        { state: 'q2', readSymbol: '1', nextState: 'q2', writeSymbol: '1', direction: 'D' },
        { state: 'q2', readSymbol: 'X', nextState: 'q2', writeSymbol: 'X', direction: 'D' },
        // q2 + B → sin transición → RECHAZO (sobran 1s)

        // q3: Regresar al inicio para buscar el siguiente par
        { state: 'q3', readSymbol: '0', nextState: 'q3', writeSymbol: '0', direction: 'I' },
        { state: 'q3', readSymbol: '1', nextState: 'q3', writeSymbol: '1', direction: 'I' },
        { state: 'q3', readSymbol: 'X', nextState: 'q3', writeSymbol: 'X', direction: 'I' },
        { state: 'q3', readSymbol: 'B', nextState: 'q0', writeSymbol: 'B', direction: 'D' },
      ];
      transitions.forEach(t => this.addTransitionRow(t));
      this.showToast('Ejemplo cargado: Igual cantidad de 0 y 1', 'success');
    }
  }

  // ---- Notificaciones Toast ----
  showToast(message, type = 'info') {
    // Eliminar toasts existentes
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


// ============ Inicializar ============
document.addEventListener('DOMContentLoaded', () => {
  const app = new UIController();
});


