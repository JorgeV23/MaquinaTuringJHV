
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


// ============================================================
// COMPONENTE 1: AlphabetDetector
// Detecta Σ desde la cadena de entrada y calcula Γ
// ============================================================
class AlphabetDetector {
  /**
   * Detectar el alfabeto de entrada Σ desde una cadena.
   * @param {string} inputString - La cadena de entrada
   * @returns {string[]} Alfabeto ordenado (sin duplicados)
   */
  static detectInputAlphabet(inputString) {
    if (!inputString) return [];
    return [...new Set(inputString.split(''))].sort();
  }

  /**
   * Construir el alfabeto de cinta Γ = Σ ∪ {B} ∪ auxiliares.
   * @param {string[]} inputAlphabet - Alfabeto de entrada Σ
   * @param {string[]} auxiliarySymbols - Símbolos auxiliares (ej: ['X','Y'])
   * @returns {string[]} Alfabeto de cinta ordenado
   */
  static buildTapeAlphabet(inputAlphabet, auxiliarySymbols = []) {
    const gamma = new Set(inputAlphabet);
    gamma.add('B'); // blanco siempre incluido
    auxiliarySymbols.forEach(s => gamma.add(s));
    return [...gamma].sort();
  }
}


// ============================================================
// COMPONENTE 2: Tape
// Gestión encapsulada de la cinta infinita
// ============================================================
class Tape {
  /**
   * @param {string} inputString - Cadena de entrada
   * @param {string} blankSymbol - Símbolo blanco (default 'B')
   */
  constructor(inputString = '', blankSymbol = 'B') {
    this.blankSymbol = blankSymbol;
    this.cells = inputString ? inputString.split('') : [this.blankSymbol];

    // Agregar blancos de relleno
    this.cells.unshift(this.blankSymbol);
    this.cells.push(this.blankSymbol);

    this.headPosition = 1; // Iniciar en el primer símbolo real
  }

  /** Leer el símbolo bajo el cabezal */
  read() {
    return this.cells[this.headPosition] || this.blankSymbol;
  }

  /** Escribir un símbolo en la posición del cabezal */
  write(symbol) {
    this.cells[this.headPosition] = symbol;
  }

  /**
   * Mover el cabezal.
   * @param {string} direction - 'D' (derecha), 'I' (izquierda), 'S' (sin movimiento)
   */
  moveHead(direction) {
    if (direction === 'D') {
      this.headPosition++;
      if (this.headPosition >= this.cells.length) {
        this.cells.push(this.blankSymbol);
      }
    } else if (direction === 'I') {
      this.headPosition--;
      if (this.headPosition < 0) {
        this.cells.unshift(this.blankSymbol);
        this.headPosition = 0;
      }
    }
    // 'S' — sin movimiento
  }

  /** Obtener datos para visualización */
  getDisplay() {
    return {
      cells: [...this.cells],
      headPosition: this.headPosition,
    };
  }
}


// ============================================================
// COMPONENTE 3: TransitionEngine
// Almacén y lookup de transiciones δ(q, σ) → (q', σ', D)
// ============================================================
class TransitionEngine {
  constructor() {
    this.transitions = {};
  }

  /**
   * Agregar una transición.
   * @param {string} state - Estado actual
   * @param {string} readSymbol - Símbolo leído
   * @param {string} nextState - Estado siguiente
   * @param {string} writeSymbol - Símbolo a escribir
   * @param {string} direction - Dirección ('D', 'I', 'S')
   */
  addTransition(state, readSymbol, nextState, writeSymbol, direction) {
    const key = `${state},${readSymbol}`;
    this.transitions[key] = {
      nextState,
      writeSymbol,
      direction: direction.toUpperCase(),
    };
  }

  /**
   * Buscar una transición.
   * @param {string} state - Estado actual
   * @param {string} symbol - Símbolo leído
   * @returns {object|null} La transición encontrada o null
   */
  getTransition(state, symbol) {
    const key = `${state},${symbol}`;
    return this.transitions[key] || null;
  }

  /**
   * Cargar transiciones desde una lista de objetos.
   * @param {Array} transitionsList - [{state, readSymbol, nextState, writeSymbol, direction}]
   */
  loadFromList(transitionsList) {
    this.transitions = {};
    for (const t of transitionsList) {
      this.addTransition(t.state, t.readSymbol, t.nextState, t.writeSymbol, t.direction);
    }
  }

  /** Obtener todas las claves de transición (para análisis) */
  getAllKeys() {
    return Object.keys(this.transitions);
  }

  /** Obtener la transición raw por clave */
  getRaw() {
    return { ...this.transitions };
  }
}


// ============================================================
// COMPONENTE 4: TuringMachine (Refactorizada)
// Orquesta Tape, TransitionEngine y AlphabetDetector
// ============================================================
class TuringMachine {
  constructor() {
    this.tape = null;
    this.engine = new TransitionEngine();
    this.currentState = '';
    this.steps = 0;
    this.initialState = '';
    this.finalStates = new Set();
    this.isRunning = false;
    this.isFinished = false;
    this.autoInterval = null;
    this.blankSymbol = 'B';

    // Componentes de la definición formal
    this.Q = new Set();      // Estados
    this.Sigma = new Set();   // Alfabeto de entrada
    this.Gamma = new Set();   // Alfabeto de cinta
  }

  /**
   * Inicializar la máquina con la configuración dada
   */
  init(inputString, initialState, finalStates, transitionsList) {
    // Crear cinta
    this.tape = new Tape(inputString, this.blankSymbol);

    this.initialState = initialState;
    this.currentState = initialState;
    this.steps = 0;
    this.isRunning = true;
    this.isFinished = false;

    // Procesar estados finales
    this.finalStates = new Set(
      finalStates.split(',').map(s => s.trim()).filter(Boolean)
    );

    // Cargar transiciones en el motor
    this.engine.loadFromList(transitionsList);

    // Construir conjuntos formales
    this.Q = new Set();
    this.Sigma = new Set();
    this.Gamma = new Set();

    // Agregar blanco a Gamma
    this.Gamma.add(this.blankSymbol);

    // Agregar estados inicial y finales
    this.Q.add(initialState);
    this.finalStates.forEach(s => this.Q.add(s));

    for (const t of transitionsList) {
      // Recopilar estados
      this.Q.add(t.state);
      this.Q.add(t.nextState);

      // Recopilar alfabetos
      this.Gamma.add(t.readSymbol);
      this.Gamma.add(t.writeSymbol);

      // Sigma es el alfabeto de entrada (Gamma menos blanco y auxiliares comunes)
      if (t.readSymbol !== this.blankSymbol) this.Sigma.add(t.readSymbol);
      if (t.writeSymbol !== this.blankSymbol) this.Sigma.add(t.writeSymbol);
    }

    // Agregar símbolos de la cinta a los conjuntos
    for (const sym of this.tape.cells) {
      this.Gamma.add(sym);
      if (sym !== this.blankSymbol) this.Sigma.add(sym);
    }

    // Detectar Σ real: solo los símbolos que aparecen en la cadena de entrada
    const inputAlphabet = AlphabetDetector.detectInputAlphabet(inputString);
    // Limpiar Sigma para que solo contenga los del input
    // (Γ tiene todos, Σ solo los de entrada)
    this.Sigma = new Set(inputAlphabet);
  }

  /**
   * Ejecutar un paso de la máquina
   * @returns {object|null} Resultado del paso o null si terminó
   */
  step() {
    if (this.isFinished) return null;

    // Leer símbolo actual
    const readSymbol = this.tape.read();

    // Verificar si está en estado final
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

    // Buscar transición usando el motor
    const transition = this.engine.getTransition(this.currentState, readSymbol);

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

    // Aplicar transición
    this.tape.write(transition.writeSymbol);
    this.currentState = transition.nextState;
    this.steps++;

    // Mover cabezal
    this.tape.moveHead(transition.direction);

    return {
      type: 'step',
      step: this.steps,
      prevState,
      prevSymbol,
      nextState: transition.nextState,
      writeSymbol: transition.writeSymbol,
      direction: transition.direction,
      state: this.currentState,
      symbol: this.tape.read(),
    };
  }

  /**
   * Obtener contenido de la cinta para mostrar
   */
  getTapeDisplay() {
    if (!this.tape) {
      return { cells: [], headPosition: 0 };
    }
    return this.tape.getDisplay();
  }

  /**
   * Obtener definición formal
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


// ============================================================
// COMPONENTE 5: ExerciseGenerators
// Generadores dinámicos de transiciones para cada ejercicio
// Cada generador implementa generateTransitions(alphabet)
// ============================================================
const ExerciseGenerators = {

  // ──────────────────────────────────────────────────────────
  // Ejercicio 1: Reemplazar todos los símbolos por X
  // Antes: solo reemplazaba '1' por 'X'
  // Ahora: reemplaza CUALQUIER símbolo del alfabeto por X
  // ──────────────────────────────────────────────────────────
  replaceWithX: {
    generateTransitions(alphabet) {
      const transitions = [];

      // Para cada símbolo del alfabeto, reemplazar por X
      for (const symbol of alphabet) {
        transitions.push({
          state: 'q0',
          readSymbol: symbol,
          nextState: 'q0',
          writeSymbol: 'X',
          direction: 'D',
        });
      }

      // Al llegar al blanco, terminar
      transitions.push({
        state: 'q0',
        readSymbol: 'B',
        nextState: 'qf',
        writeSymbol: 'B',
        direction: 'I',
      });

      return {
        defaultInput: 'abcba',
        initialState: 'q0',
        finalStates: 'qf',
        auxiliarySymbols: ['X'],
        transitions,
        description: 'Reemplazar símbolos por X',
      };
    },
  },

  // ──────────────────────────────────────────────────────────
  // Ejercicio 2: Rotar símbolos (antes "invertir bits")
  // Antes: 0→1, 1→0
  // Ahora: cada símbolo se transforma al siguiente en el
  //        alfabeto de forma circular (a→b, b→c, c→a)
  // ──────────────────────────────────────────────────────────
  rotateSymbols: {
    generateTransitions(alphabet) {
      const transitions = [];
      const sorted = [...alphabet].sort();

      // Rotar circularmente: cada símbolo → el siguiente
      for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const next = sorted[(i + 1) % sorted.length];
        transitions.push({
          state: 'q0',
          readSymbol: current,
          nextState: 'q0',
          writeSymbol: next,
          direction: 'D',
        });
      }

      // Al llegar al blanco, terminar
      transitions.push({
        state: 'q0',
        readSymbol: 'B',
        nextState: 'qf',
        writeSymbol: 'B',
        direction: 'I',
      });

      return {
        defaultInput: 'abcabc',
        initialState: 'q0',
        finalStates: 'qf',
        auxiliarySymbols: [],
        transitions,
        description: 'Rotar símbolos',
      };
    },
  },

  // ──────────────────────────────────────────────────────────
  // Ejercicio 3: Agregar símbolo al final
  // Antes: agregar '1' al final
  // Ahora: agrega el PRIMER símbolo del alfabeto al final
  // ──────────────────────────────────────────────────────────
  appendSymbol: {
    generateTransitions(alphabet) {
      const transitions = [];
      const sorted = [...alphabet].sort();
      const symbolToAppend = sorted[0]; // primer símbolo del alfabeto

      // Avanzar sobre cualquier símbolo del alfabeto
      for (const symbol of sorted) {
        transitions.push({
          state: 'q0',
          readSymbol: symbol,
          nextState: 'q0',
          writeSymbol: symbol,
          direction: 'D',
        });
      }

      // Al llegar al blanco, escribir el símbolo y aceptar
      transitions.push({
        state: 'q0',
        readSymbol: 'B',
        nextState: 'qf',
        writeSymbol: symbolToAppend,
        direction: 'S',
      });

      return {
        defaultInput: 'abca',
        initialState: 'q0',
        finalStates: 'qf',
        auxiliarySymbols: [],
        transitions,
        description: `Agregar "${symbolToAppend}" al final`,
      };
    },
  },

  // ──────────────────────────────────────────────────────────
  // Ejercicio 4: Verificar palíndromo genérico
  // Antes: solo binario (0, 1) con X/Y fijos
  // Ahora: genera estados buscar_X / verificar_X por cada
  //        símbolo del alfabeto, con marcadores auxiliares
  //        dinámicos
  // ──────────────────────────────────────────────────────────
  palindrome: {
    generateTransitions(alphabet) {
      const transitions = [];
      const sorted = [...alphabet].sort();

      // Asignar marcadores auxiliares únicos para cada símbolo
      // Pool de marcadores que no colisionan con el alfabeto
      const auxiliaryPool = 'XYZWVUTSNMKJHGFDPQR'.split('');
      const markers = {};
      const usedMarkers = [];
      let poolIdx = 0;

      for (const sym of sorted) {
        // Buscar un marcador que no esté en el alfabeto
        while (poolIdx < auxiliaryPool.length && sorted.includes(auxiliaryPool[poolIdx])) {
          poolIdx++;
        }
        if (poolIdx < auxiliaryPool.length) {
          markers[sym] = auxiliaryPool[poolIdx];
          usedMarkers.push(auxiliaryPool[poolIdx]);
          poolIdx++;
        }
      }

      const allMarkers = Object.values(markers);

      // ── q0: Leer extremo izquierdo sin marcar ──
      for (const sym of sorted) {
        transitions.push({
          state: 'q0',
          readSymbol: sym,
          nextState: `buscar_${sym}`,
          writeSymbol: markers[sym],
          direction: 'D',
        });
      }
      // Saltar marcadores ya procesados
      for (const marker of allMarkers) {
        transitions.push({
          state: 'q0',
          readSymbol: marker,
          nextState: 'q0',
          writeSymbol: marker,
          direction: 'D',
        });
      }
      // Si todo marcado o vacío → aceptar
      transitions.push({
        state: 'q0',
        readSymbol: 'B',
        nextState: 'qf',
        writeSymbol: 'B',
        direction: 'S',
      });

      // ── Por cada símbolo: buscar_X → ir al final → verificar_X ──
      for (const sym of sorted) {
        const searchState = `buscar_${sym}`;
        const verifyState = `verificar_${sym}`;

        // buscar_X: avanzar pasando todo hasta llegar a B
        for (const s of sorted) {
          transitions.push({
            state: searchState,
            readSymbol: s,
            nextState: searchState,
            writeSymbol: s,
            direction: 'D',
          });
        }
        for (const m of allMarkers) {
          transitions.push({
            state: searchState,
            readSymbol: m,
            nextState: searchState,
            writeSymbol: m,
            direction: 'D',
          });
        }
        // Al llegar a B, retroceder para buscar el último sin marcar
        transitions.push({
          state: searchState,
          readSymbol: 'B',
          nextState: verifyState,
          writeSymbol: 'B',
          direction: 'I',
        });

        // verificar_X: retroceder saltando marcadores
        for (const m of allMarkers) {
          transitions.push({
            state: verifyState,
            readSymbol: m,
            nextState: verifyState,
            writeSymbol: m,
            direction: 'I',
          });
        }
        // El último sin marcar DEBE ser el mismo símbolo
        transitions.push({
          state: verifyState,
          readSymbol: sym,
          nextState: 'volver',
          writeSymbol: markers[sym],
          direction: 'I',
        });
        // Si encuentra B sin encontrar símbolo → elemento medio → aceptar
        transitions.push({
          state: verifyState,
          readSymbol: 'B',
          nextState: 'qf',
          writeSymbol: 'B',
          direction: 'S',
        });
        // Si encuentra otro símbolo del alfabeto (no el esperado)
        // → sin transición → RECHAZO (no es palíndromo)
      }

      // ── volver: regresar al extremo izquierdo ──
      for (const s of sorted) {
        transitions.push({
          state: 'volver',
          readSymbol: s,
          nextState: 'volver',
          writeSymbol: s,
          direction: 'I',
        });
      }
      for (const m of allMarkers) {
        transitions.push({
          state: 'volver',
          readSymbol: m,
          nextState: 'volver',
          writeSymbol: m,
          direction: 'I',
        });
      }
      transitions.push({
        state: 'volver',
        readSymbol: 'B',
        nextState: 'q0',
        writeSymbol: 'B',
        direction: 'D',
      });

      return {
        defaultInput: 'abcba',
        initialState: 'q0',
        finalStates: 'qf',
        auxiliarySymbols: usedMarkers,
        transitions,
        description: 'Verificar palíndromo',
      };
    },
  },

  // ──────────────────────────────────────────────────────────
  // Ejercicio 5: Igual cantidad de dos símbolos
  // Antes: emparejar '0' con '1'
  // Ahora: emparejar alphabet[0] con alphabet[1]
  //        dinámicamente
  // ──────────────────────────────────────────────────────────
  equalCount: {
    generateTransitions(alphabet) {
      const sorted = [...alphabet].sort();
      const transitions = [];

      // Necesitamos al menos 2 símbolos para emparejar
      if (sorted.length < 2) {
        // Caso degenerado: un solo símbolo, aceptar siempre (trivial)
        transitions.push({
          state: 'q0',
          readSymbol: sorted[0],
          nextState: 'q0',
          writeSymbol: sorted[0],
          direction: 'D',
        });
        transitions.push({
          state: 'q0',
          readSymbol: 'B',
          nextState: 'qf',
          writeSymbol: 'B',
          direction: 'S',
        });

        return {
          defaultInput: sorted[0].repeat(4),
          initialState: 'q0',
          finalStates: 'qf',
          auxiliarySymbols: [],
          transitions,
          description: 'Verificar cantidad (un solo símbolo)',
        };
      }

      const symA = sorted[0]; // primer símbolo
      const symB = sorted[1]; // segundo símbolo

      // ── q0: Buscar primer símbolo sin marcar ──
      // Si symA → marcar X, ir a q1 (buscar symB)
      transitions.push({
        state: 'q0',
        readSymbol: symA,
        nextState: 'q1',
        writeSymbol: 'X',
        direction: 'D',
      });
      // Si symB → marcar X, ir a q2 (buscar symA)
      transitions.push({
        state: 'q0',
        readSymbol: symB,
        nextState: 'q2',
        writeSymbol: 'X',
        direction: 'D',
      });
      // Saltar marcados
      transitions.push({
        state: 'q0',
        readSymbol: 'X',
        nextState: 'q0',
        writeSymbol: 'X',
        direction: 'D',
      });
      // Si B → todos emparejados → aceptar
      transitions.push({
        state: 'q0',
        readSymbol: 'B',
        nextState: 'qf',
        writeSymbol: 'B',
        direction: 'S',
      });

      // ── q1: Vio symA, buscar symB sin marcar ──
      transitions.push({
        state: 'q1',
        readSymbol: symA,
        nextState: 'q1',
        writeSymbol: symA,
        direction: 'D',
      });
      transitions.push({
        state: 'q1',
        readSymbol: symB,
        nextState: 'q3',
        writeSymbol: 'X',
        direction: 'I',
      });
      transitions.push({
        state: 'q1',
        readSymbol: 'X',
        nextState: 'q1',
        writeSymbol: 'X',
        direction: 'D',
      });
      // q1 + B → sin transición → RECHAZO (sobran symA)

      // ── q2: Vio symB, buscar symA sin marcar ──
      transitions.push({
        state: 'q2',
        readSymbol: symA,
        nextState: 'q3',
        writeSymbol: 'X',
        direction: 'I',
      });
      transitions.push({
        state: 'q2',
        readSymbol: symB,
        nextState: 'q2',
        writeSymbol: symB,
        direction: 'D',
      });
      transitions.push({
        state: 'q2',
        readSymbol: 'X',
        nextState: 'q2',
        writeSymbol: 'X',
        direction: 'D',
      });
      // q2 + B → sin transición → RECHAZO (sobran symB)

      // ── q3: Regresar al inicio ──
      transitions.push({
        state: 'q3',
        readSymbol: symA,
        nextState: 'q3',
        writeSymbol: symA,
        direction: 'I',
      });
      transitions.push({
        state: 'q3',
        readSymbol: symB,
        nextState: 'q3',
        writeSymbol: symB,
        direction: 'I',
      });
      transitions.push({
        state: 'q3',
        readSymbol: 'X',
        nextState: 'q3',
        writeSymbol: 'X',
        direction: 'I',
      });
      transitions.push({
        state: 'q3',
        readSymbol: 'B',
        nextState: 'q0',
        writeSymbol: 'B',
        direction: 'D',
      });

      return {
        defaultInput: symA + symA + symB + symB,
        initialState: 'q0',
        finalStates: 'qf',
        auxiliarySymbols: ['X'],
        transitions,
        description: `Igual cantidad de "${symA}" y "${symB}"`,
      };
    },
  },
};


// ============================================================
// COMPONENTE 6: UIController
// Controlador de la interfaz (refactorizado)
// ============================================================
class UIController {
  constructor() {
    this.machine = new TuringMachine();
    this.autoInterval = null;
    this.transitionRowCount = 0;
    this.lastDirection = null; // Track last head movement direction

    this.bindEvents();
    this.addTransitionRow(); // Iniciar con una fila vacía
  }

  // ---- Enlace de Eventos ----
  bindEvents() {
    DOM.btnInit.addEventListener('click', () => this.initMachine());
    DOM.btnStep.addEventListener('click', () => this.executeStep());
    DOM.btnAuto.addEventListener('click', () => this.toggleAutoExecution());
    DOM.btnReset.addEventListener('click', () => this.resetMachine());
    DOM.btnAddTransition.addEventListener('click', () => this.addTransitionRow());

    // Botón de ejemplos: abrir/cerrar menú desplegable
    DOM.btnLoadExample.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.exampleDropdown.classList.toggle('open');
    });

    // Opciones del menú de ejemplos
    DOM.exampleMenu.addEventListener('click', (e) => {
      const option = e.target.closest('.example-option');
      if (!option) return;
      const exampleId = option.dataset.example;
      this.loadExample(parseInt(exampleId));
      DOM.exampleDropdown.classList.remove('open');
    });

    // Cerrar menú al hacer clic fuera
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

  // ---- Gestión de la Tabla de Transiciones ----
  addTransitionRow(data = {}) {
    this.transitionRowCount++;
    const row = document.createElement('tr');
    row.dataset.rowId = this.transitionRowCount;

    row.innerHTML = `
      <td><input type="text" class="tr-state" value="${data.state || ''}" placeholder="q0" autocomplete="off"></td>
      <td><input type="text" class="tr-read" value="${data.readSymbol || ''}" placeholder="σ" autocomplete="off"></td>
      <td><input type="text" class="tr-next" value="${data.nextState || ''}" placeholder="q1" autocomplete="off"></td>
      <td><input type="text" class="tr-write" value="${data.writeSymbol || ''}" placeholder="σ'" autocomplete="off"></td>
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

  // ---- Ayudantes de Validación ----
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
   * Valida si una cadena es un nombre de estado válido.
   * Acepta formatos como: q0, q1, qf, q_accept, s0, buscar_a, verificar_b, etc.
   * Debe iniciar con letra y contener solo letras, dígitos y guiones bajos.
   */
  isValidStateName(name) {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * Valida si una cadena es válida para la entrada de la cinta.
   * Se permiten letras (a-z, A-Z) y dígitos (0-9).
   */
  isValidInputString(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  /**
   * Valida si un símbolo es válido para un campo de lectura/escritura.
   * Un solo carácter: dígito, letra o símbolo reconocido.
   */
  isValidSymbol(sym) {
    return /^[a-zA-Z0-9]$/.test(sym);
  }

  // ---- Inicialización de la Máquina ----
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
      this.showFieldError(DOM.tapeAlphabet, 'Define el alfabeto de cinta (Ej: a,b,c,X,B).');
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
      // Validar cada carácter de la cadena contra el alfabeto definido
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

      // Saltar filas completamente vacías
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

    // Inicializar máquina
    this.machine.init(inputString, initialState, finalStatesStr, transitions);

    // Actualizar interfaz
    this.updateTape();
    this.updateStatus();
    this.updateFormalDefinition();
    this.clearLog();

    // Detectar y mostrar el alfabeto de entrada detectado
    const detectedAlphabet = AlphabetDetector.detectInputAlphabet(inputString);
    this.addLogEntry('info', `Máquina inicializada. Cadena: "${inputString}" | Σ = {${detectedAlphabet.join(', ')}}`);

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

  // ---- Ejecución por Paso ----
  executeStep() {
    if (this.machine.isFinished) return;

    const result = this.machine.step();
    if (!result) return;

    if (result.type === 'step') {
      this.lastDirection = result.direction; // 'D', 'I', or 'S'
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

  // ---- Ejecución Automática ----
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
      const speed = 2100 - parseInt(DOM.speedSlider.value); // Invertir: slider alto = rápido = intervalo bajo
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

  // ---- Máquina Finalizada ----
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

    // Reiniciar definición
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

      // Etiqueta de índice
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

        // Activar animación de pulso
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

  // ---- Actualización de Estado ----
  updateStatus() {
    const m = this.machine;
    const readSymbol = m.tape ? m.tape.read() : m.blankSymbol;

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

    // Desplazamiento automático
    DOM.logContainer.scrollTop = DOM.logContainer.scrollHeight;
  }

  // ---- Definición Formal ----
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

  // ──────────────────────────────────────────────────────────
  // Cargar Ejemplo (REFACTORIZADO)
  // Usa ExerciseGenerators con generateTransitions(alphabet)
  // ──────────────────────────────────────────────────────────
  loadExample(id) {
    // Limpiar transiciones existentes
    DOM.transitionsBody.innerHTML = '';
    this.transitionRowCount = 0;

    // Mapeo de IDs a generadores
    const generatorMap = {
      1: 'replaceWithX',
      2: 'rotateSymbols',
      3: 'appendSymbol',
      4: 'palindrome',
      5: 'equalCount',
    };

    const generatorKey = generatorMap[id];
    if (!generatorKey || !ExerciseGenerators[generatorKey]) {
      this.showToast('Ejemplo no encontrado', 'error');
      return;
    }

    const generator = ExerciseGenerators[generatorKey];

    // Generar transiciones con un alfabeto representativo no-binario
    const representativeAlphabet = ['a', 'b', 'c'];
    const result = generator.generateTransitions(representativeAlphabet);

    // Detectar el alfabeto real desde la cadena de ejemplo generada
    const detectedAlphabet = AlphabetDetector.detectInputAlphabet(result.defaultInput);

    // Calcular Γ automáticamente
    const tapeAlphabet = AlphabetDetector.buildTapeAlphabet(
      detectedAlphabet,
      result.auxiliarySymbols || []
    );

    // Llenar los campos de la UI
    DOM.inputString.value = result.defaultInput;
    DOM.tapeAlphabet.value = tapeAlphabet.join(', ');
    DOM.initialState.value = result.initialState;
    DOM.finalStates.value = result.finalStates;

    // Agregar las transiciones generadas a la tabla
    result.transitions.forEach(t => this.addTransitionRow(t));

    this.showToast(`Ejemplo cargado: ${result.description}`, 'success');
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
