import * as THREE from 'three';

import TouchTexture from './TouchTexture';

const glslify = require('glslify');

export default class Particles {

	constructor(webgl) {
		this.webgl = webgl;
		this.container = new THREE.Object3D();
		this.interactivePoints = [];
	}

	init(src) {
		const loader = new THREE.TextureLoader();

		loader.load(src, (texture) => {
			this.texture = texture;
			this.texture.minFilter = THREE.LinearFilter;
			this.texture.magFilter = THREE.LinearFilter;
			this.texture.format = THREE.RGBFormat;

			this.width = texture.image.width;
			this.height = texture.image.height;
			this.webgl.interactive.width = this.width;
			this.webgl.interactive.height = this.height;
			this.canvas = undefined;

			this.initPoints(true);
			this.initInteractivePoints(true);
			this.initHitArea();
			this.initTouch();
			this.resize();
			this.show();
		});
	}

	initPoints(discard) {
		this.numPoints = this.width * this.height;
		console.log(this.numPoints)
		let numVisible = this.numPoints / 100;
		let threshold = 0;
		let originalColors;

		if (discard) {
			// discard pixels darker than threshold #22
			numVisible = 0;
			threshold = 34;

			const img = this.texture.image;
			this.canvas = document.createElement('canvas');
			this.canvas.id = "mainCanvas"
			const ctx = this.canvas.getContext('2d');

			this.canvas.width = this.width;
			this.canvas.height = this.height;
			ctx.scale(1, -1);
			ctx.drawImage(img, 0, 0, this.width, this.height * -1);

			const imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
			originalColors = Float32Array.from(imgData.data);

			for (let i = 0; i < this.numPoints; i++) {
				if (originalColors[i * 4 + 0] > threshold) numVisible++;
			}

			// console.log('numVisible', numVisible, this.numPoints);
		}

		const uniforms = {
			uTime: { value: 0 },
			uRandom: { value: 1.0 },
			uDepth: { value: 2.0 },
			uSize: { value: 0.0 },
			uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
			uTexture: { value: this.texture },
			uTouch: { value: null },
		};

		const material = new THREE.RawShaderMaterial({
			uniforms,
			vertexShader: glslify(require('../../../shaders/particle.vert')),
			fragmentShader: glslify(require('../../../shaders/particle.frag')),
			depthTest: false,
			transparent: true,
			// blending: THREE.AdditiveBlending
		});

		const redmaterial = new THREE.RawShaderMaterial({
			uniforms,
			vertexShader: glslify(require('../../../shaders/particle.vert')),
			fragmentShader: glslify(require('../../../shaders/particle_red.frag')),
			depthTest: false,
			transparent: true,
			// blending: THREE.AdditiveBlending
		});

		const geometry = new THREE.InstancedBufferGeometry();

		// positions
		const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
		positions.setXYZ(0, -0.5, 0.5, 0.0);
		positions.setXYZ(1, 0.5, 0.5, 0.0);
		positions.setXYZ(2, -0.5, -0.5, 0.0);
		positions.setXYZ(3, 0.5, -0.5, 0.0);
		geometry.addAttribute('position', positions);

		// uvs
		const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
		uvs.setXYZ(0, 0.0, 0.0);
		uvs.setXYZ(1, 1.0, 0.0);
		uvs.setXYZ(2, 0.0, 1.0);
		uvs.setXYZ(3, 1.0, 1.0);
		geometry.addAttribute('uv', uvs);

		// index
		geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));

		const indices = new Uint16Array(numVisible);
		const offsets = new Float32Array(numVisible * 3);
		const angles = new Float32Array(numVisible);

		for (let i = 0, j = 0; i < this.numPoints; i++) {
			if (discard && originalColors[i * 4 + 0] <= threshold) continue;
			// if(i == 200){
			// 	offsets[j * 3 + 0] = i % this.width;
			// 	offsets[j * 3 + 1] = Math.floor(i / this.width);

			// 	indices[j] = i;

			// 	angles[j] = Math.random() * Math.PI;
			// 	console.log(offsets[j * 3 + 0], offsets[j * 3 + 1], indices[j], angles[j])	
			// 	continue
			// }
			offsets[j * 3 + 0] = i % this.width;
			offsets[j * 3 + 1] = Math.floor(i / this.width);

			indices[j] = i;

			angles[j] = Math.random() * Math.PI;

			j++;
		}

		geometry.addAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
		geometry.addAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
		geometry.addAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));

		material.defaultAttributeValues.color[1] = 0;
		material.defaultAttributeValues.color[2] = 0;
		this.object3D = new THREE.Mesh(geometry, material);

		this.container.add(this.object3D);
		console.log(this.object3D)
	}

	initInteractivePoints(discard) {

		this.numPoints_red = this.width * this.height;
		console.log(this.numPoints, this.width, this.height)
		let numVisible_red = this.numPoints;
		let threshold_red = 0;
		let originalColors_red;

		if (discard) {
			// discard pixels darker than threshold #22
			numVisible_red = 10;
			threshold_red = 34;

			const img = this.texture.image;
			// const canvas = document.createElement('canvas');
			// const canvas = document.getElementById('mainCanvas');
			const ctx = this.canvas.getContext('2d');

			// canvas.width = this.width;
			// canvas.height = this.height;
			ctx.scale(1, -1);
			ctx.drawImage(img, 0, 0, this.width, this.height * -1);

			const imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
			originalColors_red = Float32Array.from(imgData.data);

			// for (let i = 0; i < this.numPoints; i++) {
			// 	if (originalColors[i * 4 + 0] > threshold) numVisible++;
			// }

			// console.log('numVisible', numVisible, this.numPoints);
		}

		const uniforms = {
			uTime: { value: 0 },
			uRandom: { value: 1.0 },
			uDepth: { value: 2.0 },
			uSize: { value: 6.0 },
			uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
			uTexture: { value: this.texture },
			uTouch: { value: null },
		};

		const redmaterial = new THREE.RawShaderMaterial({
			uniforms,
			vertexShader: glslify(require('../../../shaders/particle.vert')),
			fragmentShader: glslify(require('../../../shaders/particle_red.frag')),
			depthTest: false,
			transparent: true,
			// blending: THREE.AdditiveBlending
		});

		const geometry = new THREE.InstancedBufferGeometry();

		// positions
		const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
		positions.setXYZ(0, -0.5, 0.5, 0.0);
		positions.setXYZ(1, 0.5, 0.5, 0.0);
		positions.setXYZ(2, -0.5, -0.5, 0.0);
		positions.setXYZ(3, 0.5, -0.5, 0.0);
		geometry.addAttribute('position', positions);

		// uvs
		const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
		uvs.setXYZ(0, 0.0, 0.0);
		uvs.setXYZ(1, 1.0, 0.0);
		uvs.setXYZ(2, 0.0, 1.0);
		uvs.setXYZ(3, 1.0, 1.0);
		geometry.addAttribute('uv', uvs);

		// index
		geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));

		const indices = new Uint16Array(numVisible_red);
		const offsets = new Float32Array(numVisible_red * 3);
		const angles = new Float32Array(numVisible_red);
		var count = 0, step = 0;
		for (let i = 0, j = 0; i < this.numPoints; i++) {
			// if (discard && originalColors[i * 4 + 0] <= threshold) continue;
			if (count > numVisible_red) break;
			step++;
			if (discard && originalColors_red[i * 4 + 0] <= threshold_red) continue;
			if (step < 4500) continue;
			count++;
			step = 0;
			// if(i == 200){
			// 	offsets[j * 3 + 0] = i % this.width;
			// 	offsets[j * 3 + 1] = Math.floor(i / this.width);

			// 	indices[j] = i;

			// 	angles[j] = Math.random() * Math.PI;
			// 	console.log(offsets[j * 3 + 0], offsets[j * 3 + 1], indices[j], angles[j])	
			// 	continue
			// }
			offsets[j * 3 + 0] = i % this.width;
			offsets[j * 3 + 1] = Math.floor(i / this.width);
			this.interactivePoints.push([i % this.width, Math.floor(i / this.width)]);
			indices[j] = i;

			angles[j] = Math.random() * Math.PI;

			j++;
		}
		this.webgl.interactive.interactivePoints = this.interactivePoints;

		geometry.addAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
		geometry.addAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
		geometry.addAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));

		this.object3D_red = new THREE.Mesh(geometry, redmaterial);

		this.container.add(this.object3D_red);
		console.log(this.object3D_red)
	}

	initTouch() {
		// create only once
		if (!this.touch) this.touch = new TouchTexture(this);
		this.object3D.material.uniforms.uTouch.value = this.touch.texture;
		this.object3D_red.material.uniforms.uTouch.value = this.touch.texture;
	}

	initHitArea() {
		const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, depthTest: false });
		material.visible = false;
		this.hitArea = new THREE.Mesh(geometry, material);
		this.container.add(this.hitArea);
	}

	addListeners() {
		this.handlerInteractiveMove = this.onInteractiveMove.bind(this);

		this.webgl.interactive.addListener('interactive-move', this.handlerInteractiveMove);
		this.webgl.interactive.objects.push(this.hitArea);
		this.webgl.interactive.enable();
	}

	removeListeners() {
		this.webgl.interactive.removeListener('interactive-move', this.handlerInteractiveMove);

		const index = this.webgl.interactive.objects.findIndex(obj => obj === this.hitArea);
		this.webgl.interactive.objects.splice(index, 1);
		this.webgl.interactive.disable();
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update(delta) {
		if (!this.object3D) return;
		if (this.touch) this.touch.update();

		this.object3D.material.uniforms.uTime.value += delta;
		this.object3D_red.material.uniforms.uTime.value += delta;
	}

	show(time = 1.0) {
		// reset
		TweenLite.fromTo(this.object3D.material.uniforms.uSize, time, { value: 0.5 }, { value: 1.5 });
		TweenLite.to(this.object3D.material.uniforms.uRandom, time, { value: 2.0 });
		TweenLite.fromTo(this.object3D.material.uniforms.uDepth, time * 1.5, { value: 40.0 }, { value: 4.0 });

		TweenLite.fromTo(this.object3D_red.material.uniforms.uSize, time, { value: 0.5 }, { value: 6 });
		TweenLite.to(this.object3D_red.material.uniforms.uRandom, time, { value: 2.0 });
		TweenLite.fromTo(this.object3D_red.material.uniforms.uDepth, time * 1.5, { value: 40.0 }, { value: 4.0 });

		this.addListeners();
	}

	hide(_destroy, time = 0.8) {
		return new Promise((resolve, reject) => {
			TweenLite.to(this.object3D.material.uniforms.uRandom, time, {
				value: 5.0, onComplete: () => {
					if (_destroy) this.destroy();
					resolve();
				}
			});
			TweenLite.to(this.object3D.material.uniforms.uDepth, time, { value: -20.0, ease: Quad.easeIn });
			TweenLite.to(this.object3D.material.uniforms.uSize, time * 0.8, { value: 0.0 });

			TweenLite.to(this.object3D_red.material.uniforms.uRandom, time, {
				value: 5.0, onComplete: () => {
					if (_destroy) this.destroy();
					resolve();
				}
			});
			TweenLite.to(this.object3D_red.material.uniforms.uDepth, time, { value: -20.0, ease: Quad.easeIn });
			TweenLite.to(this.object3D_red.material.uniforms.uSize, time * 0.8, { value: 0.0 });

			this.removeListeners();
		});
	}

	destroy() {
		if (!this.object3D) return;

		this.object3D.parent.remove(this.object3D);
		this.object3D.geometry.dispose();
		this.object3D.material.dispose();
		this.object3D = null;

		if (!this.object3D_red) return;

		this.object3D_red.parent.remove(this.object3D_red);
		this.object3D_red.geometry.dispose();
		this.object3D_red.material.dispose();
		this.object3D_red = null;

		if (!this.hitArea) return;

		this.hitArea.parent.remove(this.hitArea);
		this.hitArea.geometry.dispose();
		this.hitArea.material.dispose();
		this.hitArea = null;
	}

	// ---------------------------------------------------------------------------------------------
	// EVENT HANDLERS
	// ---------------------------------------------------------------------------------------------

	resize() {
		if (!this.object3D) return;

		const scale = this.webgl.fovHeight / this.height;
		this.object3D.scale.set(scale, scale, 1);
		this.hitArea.scale.set(scale, scale, 1);

		if (!this.object3D_red) return;

		this.object3D_red.scale.set(scale, scale, 1);
	}

	onInteractiveMove(e) {

		const uv = e.intersectionData.uv;
		// console.log("mousemove", uv)
		if (this.touch) this.touch.addTouch(uv);
	}
}
