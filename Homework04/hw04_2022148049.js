import { resizeAspectRatio } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let colorBuffer; // 색상을 동적으로 변경하기 위한 버퍼
let startTime = 0; // 애니메이션 시작 시간

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
        requestAnimationFrame(animate);
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
    
    // 비디오와 유사한 어두운 남색 배경 설정
    gl.clearColor(0.1, 0.15, 0.25, 1.0); 
    
    return true;
}

function setupBuffers() {
    // 크기 조절(Scale)을 직관적으로 하기 위해 1x1 크기의 기본 정사각형을 정의합니다.
    // 중심이 (0,0) 이며, 너비와 높이가 1입니다.
    const rectVertices = new Float32Array([
        -0.5,  0.5,  // 좌상단
        -0.5, -0.5,  // 좌하단
         0.5, -0.5,  // 우하단
         0.5,  0.5   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rectVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color (동적으로 변경할 것이므로 DYNAMIC_DRAW 사용)
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // 초기화 시점에는 빈 버퍼만 생성합니다.
    gl.bufferData(gl.ARRAY_BUFFER, 16 * 4, gl.DYNAMIC_DRAW); 
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

// 도형의 색상을 업데이트하는 헬퍼 함수
function setColor(r, g, b) {
    const colors = new Float32Array([
        r, g, b, 1.0,
        r, g, b, 1.0,
        r, g, b, 1.0,
        r, g, b, 1.0
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, colors);
}

// 특정 변환 행렬과 색상을 이용해 사각형을 그리는 함수
function drawRect(transformMatrix, r, g, b) {
    setColor(r, g, b);
    shader.use();
    shader.setMat4("u_transform", transformMatrix);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function render(angle1, angle2) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let modelMatrix = mat4.create();

    // 1. 기둥 그리기 (고정)
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [0.0, -0.35, 0.0]); // 중앙에서 아래로 이동
    mat4.scale(modelMatrix, modelMatrix, [0.20, 1.0, 1.0]); 
    drawRect(modelMatrix, 0.55, 0.35, 0.15); // 갈색
    
    // 큰 날개의 기본 회전 행렬을 먼저 계산합니다.
    let bigBladeRotation = mat4.create();
    mat4.translate(bigBladeRotation, bigBladeRotation, [0.0, 0.15, 0.0]); // 중심을 기준으로 회전
    mat4.rotate(bigBladeRotation, bigBladeRotation, angle1, [0, 0, 1]);

    // 2. 오른쪽 큰 날개 (흰색)
    let rightBigBlade = mat4.create();
    mat4.copy(rightBigBlade, bigBladeRotation);
    mat4.translate(rightBigBlade, rightBigBlade, [0.15, 0.0, 0.0]); // 중심을 오른쪽으로
    mat4.scale(rightBigBlade, rightBigBlade, [0.3, 0.1, 1.0]); 
    drawRect(rightBigBlade, 0.9, 0.9, 0.9);

    // 3. 왼쪽 큰 날개 (흰색)
    let leftBigBlade = mat4.create();
    mat4.copy(leftBigBlade, bigBladeRotation);
    mat4.translate(leftBigBlade, leftBigBlade, [-0.15, 0.0, 0.0]); // 중심을 왼쪽으로
    mat4.scale(leftBigBlade, leftBigBlade, [0.3, 0.1, 1.0]);
    drawRect(leftBigBlade, 0.9, 0.9, 0.9);

    // 4. 오른쪽 작은 날개 (회색)
    let rightSmallBlade = mat4.create();
    mat4.copy(rightSmallBlade, bigBladeRotation); // 부모(큰 날개)의 회전을 상속
    mat4.translate(rightSmallBlade, rightSmallBlade, [0.3, 0.0, 0.0]); // 오른쪽 큰 날개의 끝 지점으로 이동
    mat4.rotate(rightSmallBlade, rightSmallBlade, angle2, [0, 0, 1]); // 자식(작은 날개)의 독립적인 회전
    mat4.scale(rightSmallBlade, rightSmallBlade, [0.04, 0.25, 1.0]); // 작고 길쭉하게
    drawRect(rightSmallBlade, 0.6, 0.6, 0.6);

    // 5. 왼쪽 작은 날개 (회색)
    let leftSmallBlade = mat4.create();
    mat4.copy(leftSmallBlade, bigBladeRotation); // 부모(큰 날개)의 회전을 상속
    mat4.translate(leftSmallBlade, leftSmallBlade, [-0.3, 0.0, 0.0]); // 왼쪽 큰 날개의 끝 지점으로 이동
    mat4.rotate(leftSmallBlade, leftSmallBlade, angle2, [0, 0, 1]); // 자식(작은 날개)의 독립적인 회전
    mat4.scale(leftSmallBlade, leftSmallBlade, [0.04, 0.25, 1.0]);
    drawRect(leftSmallBlade, 0.6, 0.6, 0.6);
}

function animate(currentTime) {
    if (startTime === 0) {
        startTime = currentTime; // 처음 호출될 때 시작 시간 기록
    }
    
    // elapsedTime 계산 (초 단위)
    const elapsedTime = (currentTime - startTime) / 1000.0;

    // 문제 조건에 따른 회전 각도 계산
    const angle1 = Math.sin(elapsedTime) * Math.PI * 2.0;    // 큰 날개
    const angle2 = Math.sin(elapsedTime) * Math.PI * -10.0;  // 작은 날개

    render(angle1, angle2);

    requestAnimationFrame(animate);
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
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}