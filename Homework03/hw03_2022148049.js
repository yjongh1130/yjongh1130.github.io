import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 변경
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true
let startPoint = null;  // mouse button을 누른 최초 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 현재 위치
let lineSegments = []; // 그려진 선분 데이터를 저장
let drawnCircles = []; // 그려진 원 데이터를 저장
let crossPoints = []; // 원과 선분의 교점 데이터를 저장
let textOverlay1; // 원 정보 표시
let textOverlay2; // 선분 정보 표시
let textOverlay3; // 교점 정보 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object

// DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;

    resizeAspectRatio(gl, canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 캔버스 좌표를 WebGL NDC 좌표로 변환
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1, 
        -((y / canvas.height) * 2 - 1) 
    ];
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); 
        event.stopPropagation(); 

        const rect = canvas.getBoundingClientRect(); 
        const x = event.clientX - rect.left;  
        const y = event.clientY - rect.top;   
        
        if (!isDrawing) { 
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; 
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; 
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            if (drawnCircles.length === 0) {
                const deltaX = tempEndPoint[0] - startPoint[0];
                const deltaY = tempEndPoint[1] - startPoint[1];
                const circleRadius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                drawnCircles.push([...startPoint, circleRadius]);

                updateText(textOverlay1, `Circle Data: Center (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}), Radius: ${circleRadius.toFixed(2)}`);
                updateText(textOverlay2, "Now click and drag to draw a line segment.");
            } else {
                lineSegments.push([...startPoint, ...tempEndPoint]);

                const [startX, startY, endX, endY] = lineSegments[0];

                updateText(textOverlay2, `Line Data: (${startX.toFixed(2)}, ${startY.toFixed(2)}) to (${endX.toFixed(2)}, ${endY.toFixed(2)})`);

                crossPoints = calculateIntersections(
                    { cx: drawnCircles[0][0], cy: drawnCircles[0][1], r: drawnCircles[0][2] },
                    { x1: startX, y1: startY, x2: endX, y2: endY }
                ).filter((pt) => {
                    const dotProd1 = (pt.x - startX) * (endX - startX) + (pt.y - startY) * (endY - startY);
                    const dotProd2 = (pt.x - endX) * (startX - endX) + (pt.y - endY) * (startY - endY);
                    return dotProd1 >= 0 && dotProd2 >= 0;
                });

                if (crossPoints.length === 0) {
                    updateText(textOverlay3, "Intersection: None found.");
                } else if (crossPoints.length === 1) {
                    updateText(textOverlay3, `Intersection: 1 Point at (${crossPoints[0].x.toFixed(2)}, ${crossPoints[0].y.toFixed(2)})`);
                } else {
                    updateText(textOverlay3, `Intersection: 2 Points at (${crossPoints[0].x.toFixed(2)}, ${crossPoints[0].y.toFixed(2)}) and (${crossPoints[1].x.toFixed(2)}, ${crossPoints[1].y.toFixed(2)})`);
                }
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function renderCircleShape(cx, cy, radius, colorArr) {
    const resolution = 100;
    const vertices = [];
    for (let i = 0; i < resolution; i++) {
        const angle1 = (i / resolution) * 2 * Math.PI;
        const angle2 = ((i + 1) / resolution) * 2 * Math.PI;

        vertices.push(
            cx + radius * Math.cos(angle1), cy + radius * Math.sin(angle1),
            cx + radius * Math.cos(angle2), cy + radius * Math.sin(angle2)
        );
    }

    shader.setVec4("u_color", colorArr);
    gl.bindVertexArray(vao);
    for (let i = 0; i < vertices.length; i += 4) {
        const lineSeg = vertices.slice(i, i + 4);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineSeg), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINES, 0, 2);
    }
}

function calculateIntersections(circle, line) {
    const dX = line.x2 - line.x1;
    const dY = line.y2 - line.y1;

    const A = dX * dX + dY * dY;
    const B = 2 * (dX * (line.x1 - circle.cx) + dY * (line.y1 - circle.cy));
    const C = (line.x1 - circle.cx) ** 2 + (line.y1 - circle.cy) ** 2 - circle.r ** 2;

    const det = B * B - 4 * A * C;

    if (det < 0) return [];
    if (det === 0) {
        const tVal = -B / (2 * A);
        return [{ x: line.x1 + tVal * dX, y: line.y1 + tVal * dY }];
    }

    const rootDet = Math.sqrt(det);
    const tVal1 = (-B + rootDet) / (2 * A);
    const tVal2 = (-B - rootDet) / (2 * A);

    return [
        { x: line.x1 + tVal1 * dX, y: line.y1 + tVal1 * dY },
        { x: line.x1 + tVal2 * dX, y: line.y1 + tVal2 * dY }
    ];
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 1. 선분 렌더링
    let count = 0;
    for (let segment of lineSegments) {
        if (count === 0) shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        else shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(segment), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
        count++;
    }

    // 2. 원 렌더링
    for (let circ of drawnCircles) {
        renderCircleShape(circ[0], circ[1], circ[2], [1.0, 0.4, 0.7, 1.0]);
    }

    // 3. 교점 렌더링
    for (let point of crossPoints) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([point.x, point.y]), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, 1);
    }

    // 4. 임시 도형 렌더링
    if (isDrawing && startPoint && tempEndPoint) {
        if (drawnCircles.length === 0) {
            const tempDx = tempEndPoint[0] - startPoint[0];
            const tempDy = tempEndPoint[1] - startPoint[1];
            const tempRad = Math.sqrt(tempDx * tempDx + tempDy * tempDy);
            renderCircleShape(startPoint[0], startPoint[1], tempRad, [0.5, 0.5, 0.5, 1.0]);
        } else {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); 
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // 5. 축(Axes) 렌더링
    axes.draw(mat4.create(), mat4.create()); 
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        await initShader();
        
        setupBuffers();
        shader.use();

        textOverlay1 = setupText(canvas, "No circle data yet. Draw a circle first.", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        setupMouseEvents();
        
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}