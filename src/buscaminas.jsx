<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Blender Deluxe Diego Cortés 3D</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Three.js Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <!-- OrbitControls -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        
        body {
            margin: 0;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
            background-color: #303030; /* Blender Dark Grey */
            color: #ffffff;
        }

        #ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
            box-sizing: border-box;
        }

        .hud-panel {
            pointer-events: auto;
            background: rgba(45, 45, 45, 0.9);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #555;
            backdrop-filter: blur(5px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }

        .blender-orange { color: #ea7600; }
        .blender-blue { color: #2f80ed; }

        /* Modal Overlay */
        #modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: auto;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s;
            z-index: 100;
        }

        #modal-overlay.visible {
            opacity: 1;
            visibility: visible;
        }

        .btn {
            background-color: #444;
            color: white;
            border: 1px solid #666;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
        }
        .btn:hover { background-color: #555; border-color: #888; }
        .btn-primary { background-color: #ea7600; border-color: #ea7600; }
        .btn-primary:hover { background-color: #ff8c00; border-color: #ff8c00; }

        /* Loading Screen */
        #loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #222;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
            transition: opacity 0.5s;
        }

        .credits {
            position: absolute;
            bottom: 10px;
            right: 15px;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
            font-family: monospace;
            pointer-events: none;
        }
    </style>
</head>
<body>

    <!-- Loading Screen -->
    <div id="loader">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-300 mb-2">Cargando Motor 3D...</h1>
            <div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
    </div>

    <!-- UI Layer -->
    <div id="ui-layer">
        <!-- Top Bar -->
        <div class="flex justify-between items-start w-full">
            <div class="hud-panel">
                <h1 class="text-xl font-bold tracking-tight"><span class="blender-orange">Blender</span> Deluxe</h1>
                <p class="text-xs text-gray-400">Diego Cortés 3D v1.3</p>
            </div>
            
            <div class="hud-panel flex gap-4 text-center">
                <div>
                    <div class="text-xs text-gray-400 uppercase">Minas</div>
                    <div id="mines-display" class="text-xl font-mono text-red-400 font-bold">12</div>
                </div>
                <div>
                    <div class="text-xs text-gray-400 uppercase">Tiempo</div>
                    <div id="timer-display" class="text-xl font-mono text-gray-200">000</div>
                </div>
            </div>
        </div>

        <!-- Bottom Controls -->
        <div class="flex justify-center w-full pb-4 items-end relative">
            <div class="hud-panel flex flex-col items-center gap-2">
                <div class="flex gap-2">
                    <button id="btn-mode-dig" class="btn btn-primary" onclick="setMode('dig')">⛏️ Cavar</button>
                    <button id="btn-mode-flag" class="btn" onclick="setMode('flag')">🚩 Bandera</button>
                    <div class="w-px bg-gray-600 mx-2"></div>
                    <button class="btn" onclick="resetCamera()">🎥 Reset</button>
                </div>
                <div class="text-xs text-orange-400 mt-1 font-bold">⚠️ ¡Cuidado! Rotación automática al jugar</div>
            </div>
        </div>
        
        <!-- Créditos Diego Cortes -->
        <div class="credits">Creado por Diego Cortes</div>
    </div>

    <!-- Result Modal -->
    <div id="modal-overlay">
        <div class="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-600 text-center max-w-sm">
            <div id="modal-icon" class="text-6xl mb-4">🏆</div>
            <h2 id="modal-title" class="text-3xl font-bold mb-2 text-white">¡Renderizado!</h2>
            <p id="modal-msg" class="text-gray-400 mb-6">Misión cumplida, Blender Deluxe.</p>
            <button onclick="restartGame()" class="btn btn-primary w-full py-3 text-lg">Nueva Escena</button>
        </div>
    </div>

<script>
    // --- Configuración Global ---
    const ROWS = 10;
    const COLS = 10;
    const TOTAL_MINES = 12;
    const CUBE_SIZE = 4;
    const GAP = 0.2;
    
    // Variables de Estado
    let gameActive = false;
    let isFirstClick = true;
    let gridData = [];
    let mineCount = TOTAL_MINES;
    let timer = 0;
    let timerInterval;
    let inputMode = 'dig'; // 'dig' or 'flag'
    
    // Three.js Variables
    let scene, camera, renderer, controls, raycaster;
    let mouse = new THREE.Vector2();
    let cubesGroup = new THREE.Group();
    let textures = {}; // Cache de texturas generadas
    let hoveredCube = null;

    // Colores Estilo Blender
    const COLORS = {
        bg: 0x303030,
        cubeHidden: 0x727272,
        cubeHover: 0x888888,
        cubeRevealed: 0x2b2b2b,
        orange: 0xea7600,
        text: 0xffffff,
        mine: 0xff3333,
        flag: 0xea7600
    };

    // --- Inicialización del Motor 3D ---
    window.onload = () => {
        init3D();
        generateTextures(); // Generar texturas de números en canvas
        initGame();
        animate();
        
        // Ocultar loader
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
        }, 1000);
    };

    function init3D() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(COLORS.bg);
        scene.fog = new THREE.Fog(COLORS.bg, 20, 100);

        // Camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 45, 35); // Vista isométrica inicial

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.2; // No permitir ir bajo el suelo
        controls.minDistance = 20;
        controls.maxDistance = 80;

        // Luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);

        // Grid Helper (Piso)
        const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x383838);
        scene.add(gridHelper);

        // Raycaster
        raycaster = new THREE.Raycaster();

        // Event Listeners
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp); // Usamos pointerup para clicks
        window.addEventListener('keydown', onKeyDown);
    }

    // --- Generación de Texturas Dinámicas (Canvas) ---
    function generateTextures() {
        // Función auxiliar para dibujar texto centrado en canvas cuadrado
        function createTextTexture(text, color, bgColor = null) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, 256, 256);
            }

            // Borde ligero
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, 256, 256);

            ctx.font = 'bold 140px Inter, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color;
            ctx.fillText(text, 128, 128);

            const tex = new THREE.CanvasTexture(canvas);
            return tex;
        }

        const colors = [
            'transparent', '#2f80ed', '#27ae60', '#e74c3c', '#9b59b6', '#c0392b', '#16a085', '#2c3e50', '#7f8c8d'
        ];

        // Números 1-8
        for (let i = 1; i <= 8; i++) {
            textures[i] = createTextTexture(i.toString(), colors[i], '#2b2b2b');
        }
        
        // Textura vacía revelada
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = 64; emptyCanvas.height = 64;
        const ctx = emptyCanvas.getContext('2d');
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(0,0,64,64);
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 4;
        ctx.strokeRect(0,0,64,64);
        textures['empty'] = new THREE.CanvasTexture(emptyCanvas);

        // Bandera
        textures['flag'] = createTextTexture('🚩', '#ea7600');
        
        // Mina
        textures['mine'] = createTextTexture('💣', '#000000', '#e74c3c');
    }

    // --- Lógica del Juego ---
    function initGame() {
        gameActive = true;
        isFirstClick = true;
        mineCount = TOTAL_MINES;
        timer = 0;
        updateUI();

        // Limpiar grupo anterior
        scene.remove(cubesGroup);
        cubesGroup = new THREE.Group();
        gridData = [];

        // Offset para centrar el tablero
        const offset = (ROWS * (CUBE_SIZE + GAP)) / 2 - (CUBE_SIZE / 2);

        // Crear Grid
        for (let x = 0; x < ROWS; x++) {
            gridData[x] = [];
            for (let z = 0; z < COLS; z++) {
                // Mesh del Cubo
                const geometry = new THREE.BoxGeometry(CUBE_SIZE, 1, CUBE_SIZE);
                // Material inicial: Gris estilo Blender
                const material = new THREE.MeshStandardMaterial({ 
                    color: COLORS.cubeHidden,
                    roughness: 0.7,
                    metalness: 0.1
                });
                
                const cube = new THREE.Mesh(geometry, material);
                
                // Posicionar
                cube.position.set(
                    x * (CUBE_SIZE + GAP) - offset,
                    0, 
                    z * (CUBE_SIZE + GAP) - offset
                );
                
                cube.castShadow = true;
                cube.receiveShadow = true;

                // Datos lógicos atados al objeto 3D
                cube.userData = {
                    x: x, 
                    z: z,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborCount: 0
                };

                cubesGroup.add(cube);
                gridData[x][z] = cube;
            }
        }
        scene.add(cubesGroup);

        // Reiniciar Timer
        if (timerInterval) clearInterval(timerInterval);
        document.getElementById('modal-overlay').classList.remove('visible');
    }

    function placeMines(safeX, safeZ) {
        let placed = 0;
        while (placed < TOTAL_MINES) {
            let x = Math.floor(Math.random() * ROWS);
            let z = Math.floor(Math.random() * COLS);

            let cube = gridData[x][z];
            
            // Evitar poner mina en el primer click o sus alrededores
            if (!cube.userData.isMine && (Math.abs(x - safeX) > 1 || Math.abs(z - safeZ) > 1)) {
                cube.userData.isMine = true;
                placed++;
            }
        }
        calculateNumbers();
        startTimer();
    }

    function calculateNumbers() {
        for (let x = 0; x < ROWS; x++) {
            for (let z = 0; z < COLS; z++) {
                let cube = gridData[x][z];
                if (cube.userData.isMine) continue;

                let count = 0;
                // Vecinos 3x3
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        let nx = x + dx;
                        let nz = z + dz;
                        if (nx >= 0 && nx < ROWS && nz >= 0 && nz < COLS) {
                            if (gridData[nx][nz].userData.isMine) count++;
                        }
                    }
                }
                cube.userData.neighborCount = count;
            }
        }
    }

    // --- Interacción ---
    function handleAction(cube, isRightClick) {
        if (!gameActive || cube.userData.isRevealed) return;

        const { x, z } = cube.userData;

        // Modo Bandera (Click Derecho o Toggle UI)
        if (isRightClick || inputMode === 'flag') {
            const flagChanged = toggleFlag(cube);
            // Rotar automáticamente si la bandera cambió de estado exitosamente
            if (flagChanged) rotateCamera90();
            return;
        }

        // Modo Cavar
        if (cube.userData.isFlagged) return; // No cavar banderas

        if (isFirstClick) {
            placeMines(x, z);
            isFirstClick = false;
        }

        revealCell(cube);
        
        // Rotar automáticamente si se reveló una celda y el juego sigue activo (no explotó)
        if (gameActive) rotateCamera90();
    }

    function revealCell(cube) {
        if (cube.userData.isRevealed || cube.userData.isFlagged) return;

        cube.userData.isRevealed = true;

        // Animación simple: bajar el cubo y cambiar textura
        cube.position.y = -0.5; // "Hundir" tecla
        
        if (cube.userData.isMine) {
            // GAME OVER
            cube.material = new THREE.MeshBasicMaterial({ map: textures['mine'] });
            gameOver(false);
        } else {
            const count = cube.userData.neighborCount;
            if (count > 0) {
                // Mostrar número
                cube.material = new THREE.MeshStandardMaterial({ 
                    map: textures[count],
                    color: 0xffffff
                });
            } else {
                // Vacío
                cube.material = new THREE.MeshStandardMaterial({ 
                    map: textures['empty'],
                    color: 0xffffff
                });
                // Flood Fill
                floodFill(cube.userData.x, cube.userData.z);
            }
            checkWin();
        }
    }

    function floodFill(x, z) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                let nx = x + dx;
                let nz = z + dz;
                if (nx >= 0 && nx < ROWS && nz >= 0 && nz < COLS) {
                    let neighbor = gridData[nx][nz];
                    if (!neighbor.userData.isRevealed && !neighbor.userData.isMine) {
                        revealCell(neighbor);
                    }
                }
            }
        }
    }

    function toggleFlag(cube) {
        if (cube.userData.isRevealed) return false;
        
        if (!cube.userData.isFlagged) {
            if (mineCount > 0) {
                cube.userData.isFlagged = true;
                mineCount--;
                cube.material.color.setHex(COLORS.orange); // Blender Orange Flag
                updateUI();
                return true; // Acción exitosa
            }
        } else {
            cube.userData.isFlagged = false;
            mineCount++;
            cube.material.color.setHex(COLORS.cubeHidden); // Volver a gris
            updateUI();
            return true; // Acción exitosa
        }
        return false; // No hubo cambio
    }

    function checkWin() {
        let revealedCount = 0;
        gridData.forEach(row => row.forEach(c => {
            if (c.userData.isRevealed) revealedCount++;
        }));

        if (revealedCount === (ROWS * COLS) - TOTAL_MINES) {
            gameOver(true);
        }
    }

    function gameOver(win) {
        gameActive = false;
        clearInterval(timerInterval);
        
        const title = document.getElementById('modal-title');
        const msg = document.getElementById('modal-msg');
        const icon = document.getElementById('modal-icon');

        if (win) {
            title.textContent = "¡Renderizado Completo!";
            msg.textContent = `Blender Deluxe ha despejado la grilla en ${timer}s.`;
            icon.textContent = "🏆";
        } else {
            title.textContent = "Crash!";
            title.style.color = "#ff4444";
            msg.textContent = "Has detonado un vértice inestable.";
            icon.textContent = "💥";
            
            // Revelar todas las minas
            gridData.forEach(row => row.forEach(c => {
                if (c.userData.isMine) {
                    c.position.y = 0.5; // Subir minas
                    c.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                }
            }));
        }

        setTimeout(() => {
            document.getElementById('modal-overlay').classList.add('visible');
        }, 1000);
    }

    // --- Input Handling ---
    let isDragging = false;
    let clickStartTime = 0;

    function onPointerMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Hover Effect
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cubesGroup.children);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (hoveredCube !== object) {
                // Reset prev hover
                if (hoveredCube && !hoveredCube.userData.isRevealed && !hoveredCube.userData.isFlagged) {
                    hoveredCube.material.color.setHex(COLORS.cubeHidden);
                }
                hoveredCube = object;
                // Set new hover highlight (Blender Active Object color)
                if (!hoveredCube.userData.isRevealed && !hoveredCube.userData.isFlagged) {
                    hoveredCube.material.color.setHex(COLORS.cubeHover);
                }
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (hoveredCube && !hoveredCube.userData.isRevealed && !hoveredCube.userData.isFlagged) {
                hoveredCube.material.color.setHex(COLORS.cubeHidden);
            }
            hoveredCube = null;
            document.body.style.cursor = 'default';
        }
    }

    // Detectar si fue un click o un drag de camara
    document.addEventListener('pointerdown', () => { clickStartTime = Date.now(); });

    function onPointerUp(event) {
        if (Date.now() - clickStartTime > 200) return; // Fue un drag, ignorar

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cubesGroup.children);

        if (intersects.length > 0) {
            const cube = intersects[0].object;
            const isRightClick = event.button === 2;
            handleAction(cube, isRightClick);
        }
    }

    function onKeyDown(e) {
        if (e.code === 'KeyR' || e.code === 'Space') {
            rotateCamera90();
        }
    }

    function rotateCamera90() {
        // Rotar cámara 90 grados alrededor del eje Y
        const axis = new THREE.Vector3(0, 1, 0);
        const angle = Math.PI / 2;
        
        // La posición es relativa al target (0,0,0 por defecto)
        camera.position.applyAxisAngle(axis, angle);
        camera.lookAt(0, 0, 0); // Re-enfocar al centro
        controls.update();
    }

    // --- UI & Helpers ---
    function setMode(mode) {
        inputMode = mode;
        const btnDig = document.getElementById('btn-mode-dig');
        const btnFlag = document.getElementById('btn-mode-flag');
        
        if (mode === 'dig') {
            btnDig.classList.add('btn-primary');
            btnFlag.classList.remove('btn-primary');
        } else {
            btnFlag.classList.add('btn-primary');
            btnDig.classList.remove('btn-primary');
        }
    }

    function resetCamera() {
        // Animacion suave de camara
        camera.position.set(0, 45, 35);
        camera.lookAt(0,0,0);
        controls.reset();
    }

    function restartGame() {
        initGame();
    }

    function updateUI() {
        document.getElementById('mines-display').textContent = mineCount;
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            timer++;
            document.getElementById('timer-display').textContent = timer.toString().padStart(3, '0');
        }, 1000);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

</script>
</body>
</html>
