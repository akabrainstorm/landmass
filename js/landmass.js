var scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
var controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.z = 100;
controls.pRotateUp( Math.PI / 4 );
controls.update();

var texture;
var geometry;
var material;
var land = null;

var regions = [
	{height: 0.3, color: [50, 99, 195]},	// Water Deep
	{height: 0.4, color: [54, 103, 199]},	// Water Shallow
	{height: 0.45, color: [210, 208, 125]},	// Sand
	{height: 0.55, color: [86, 152, 23]},	// Grass
	{height: 0.6, color: [62, 107, 18]},	// Grass 2
	{height: 0.7, color: [90, 69, 60]},		// Rock
	{height: 0.9, color: [75, 60, 53]},		// Rock 2
	{height: 1.0, color: [255, 255, 255]}	// Snow
]

function animate() {
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

animate();

function GenerateNoiseMap(mapSize, noiseScale, octaves, persistance, lacunarity) {
	noise.seed(Math.random());
	var noiseMap = new Array(mapSize * mapSize);
	noiseScale = Math.max(noiseScale, 0.001);

	var maxHeight = null, minHeight = null;

	for (var y = 0; y < mapSize; y++) {
		for (var x = 0; x < mapSize; x++) {

			var amplitude = 1;
			var frequency = 1;
			var noiseHeight = 0;

			for (var o = 0; o < octaves; o++) {
				var sampleX = x / (noiseScale * frequency);
				var sampleY = y / (noiseScale * frequency);

				var perlinValue = noise.perlin2(sampleX, sampleY);
				noiseHeight += perlinValue * amplitude;

				amplitude *= persistance;
				frequency *= lacunarity;
			}

			noiseMap[y * mapSize + x] = noiseHeight;

			if (maxHeight == null) {
				maxHeight = minHeight = noiseHeight;
			} else {
				if (noiseHeight > maxHeight) {
					maxHeight = noiseHeight;
				}
				if(noiseHeight < minHeight) {
					minHeight = noiseHeight;
				}
			}
		}
	}

	console.log(maxHeight + ":" + minHeight);

	for (var i = 0; i < noiseMap.length; i++) {
		noiseMap[i] = (noiseMap[i]-minHeight)/(maxHeight-minHeight);
	}

	return noiseMap;
}

function Generate(size = 100, a = 25, b = 5, c = 0.5, d = 0.7) {
	var noiseMap = GenerateNoiseMap(size, a, b, c, d);
	var ndata = new Uint8Array(size * size * 3);
	for (var y = 0; y < size; y++) {
		for (var x = 0; x < size; x++) {
			var index = y * size + x;
			var offset = index * 3;
			var ncolor = [0, 0, 0];

			for (var i = 0; i < regions.length; i++)
				if (noiseMap[index] <= regions[i].height){
					ncolor = regions[i].color;
					break;
			}

			if (ncolor[0] == 0) {
				//console.log(noiseMap[index]);
			}

			ndata[offset] = ncolor[0];
			ndata[++offset] = ncolor[1];
			ndata[++offset] = ncolor[2];

			/*ndata[offset] = noiseMap[index]*255;
			ndata[++offset] = noiseMap[index]*255;
			ndata[++offset] = noiseMap[index]*255;*/
		}
	}

	if (land != null) {
		scene.remove(land);
		land.material.dispose();
		land.geometry.dispose();
		texture.dispose();
	}

	texture = new THREE.DataTexture(ndata, size, size, THREE.RGBFormat, THREE.UnsignedByteType, THREE.UVMapping);
	//texture.magFilter = texture.minFilter = THREE.LinearFilter;
	texture.needsUpdate = true;

	geometry = new THREE.PlaneGeometry(size, size, size, size);

	for (var y = 0; y < size; y++) {
		for (var x = 0; x < size; x++) {
			var h = noiseMap[y*size+x] - 0.4;
			h = Math.max(h, 0);
			geometry.vertices[(size-y)*(size+1)+x].z = h*20;
		}
	}

	material = new THREE.MeshBasicMaterial({map: texture});
	land = new THREE.Mesh(geometry, material);
	land.rotation.x = -Math.PI / 2;

	scene.add(land);
}

Generate(100, 25, 5, 0.5, 0.7);