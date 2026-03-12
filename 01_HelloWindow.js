// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);

gl.enable(gl.SCISSOR_TEST);


// Start rendering
render();

// Render loop
function render() {   
    // Draw something here

    const w = canvas.width;
    const h = canvas.height;
    
    gl.viewport(0, h/2, w/2, h/2);
    gl.scissor(0, h / 2, w / 2, h / 2);
    gl.clearColor(0, 1.0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(w/2, h/2, w/2, h/2);
    gl.scissor(w / 2, h / 2, w / 2, h / 2);
    gl.clearColor(1.0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, w / 2, h / 2);
    gl.scissor(0, 0, w / 2, h / 2);
    gl.clearColor(0, 0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(w/2, 0, w/2, h/2);
    gl.scissor(w / 2, 0, w / 2, h / 2);
    gl.clearColor(1.0, 1.0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    canvas.width = Math.min(window.innerWidth, window.innerHeight, 500);
    canvas.height = Math.min(window.innerHeight, window.innerWidth, 500);
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

