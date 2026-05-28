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

            const symA = sorted[0]; // primer símbolo a emparejar
            const symB = sorted[1]; // segundo símbolo a emparejar

            // Símbolos extra (sorted[2..]) que no participan en el emparejamiento.
            // Se agregan transiciones "pass-through" para que la máquina no quede
            // sin transición definida si la cadena los contiene.
            const extraSymbols = sorted.slice(2);

            // ── q0: Buscar primer símbolo sin marcar ──
            transitions.push({
                state: 'q0',
                readSymbol: symA,
                nextState: 'q1',
                writeSymbol: 'X',
                direction: 'D',
            });
            transitions.push({
                state: 'q0',
                readSymbol: symB,
                nextState: 'q2',
                writeSymbol: 'X',
                direction: 'D',
            });
            transitions.push({
                state: 'q0',
                readSymbol: 'X',
                nextState: 'q0',
                writeSymbol: 'X',
                direction: 'D',
            });
            // Símbolos extra: saltar sin procesar
            for (const s of extraSymbols) {
                transitions.push({
                    state: 'q0',
                    readSymbol: s,
                    nextState: 'q0',
                    writeSymbol: s,
                    direction: 'D',
                });
            }
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
            for (const s of extraSymbols) {
                transitions.push({
                    state: 'q1',
                    readSymbol: s,
                    nextState: 'q1',
                    writeSymbol: s,
                    direction: 'D',
                });
            }
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
            for (const s of extraSymbols) {
                transitions.push({
                    state: 'q2',
                    readSymbol: s,
                    nextState: 'q2',
                    writeSymbol: s,
                    direction: 'D',
                });
            }
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
            for (const s of extraSymbols) {
                transitions.push({
                    state: 'q3',
                    readSymbol: s,
                    nextState: 'q3',
                    writeSymbol: s,
                    direction: 'I',
                });
            }
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