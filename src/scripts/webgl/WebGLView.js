import 'three';
import { TweenLite } from 'gsap/TweenMax';

import InteractiveControls from './controls/InteractiveControls';
import Particles from './particles/Particles';

const glslify = require('glslify');

export default class WebGLView {

	constructor(app) {
		this.app = app;

		this.samples = [
			'images/sample-01.png',
			// 'images/sample-02.png',
			// 'images/sample-03.png',
			// 'images/sample-04.png',
			// 'images/sample-05.png',
		];
		this.mousedown = false;

		this.initThree();
		this.initParticles();
		this.initControls();
		this.addListeners();

		const rnd = ~~(Math.random() * this.samples.length);
		this.goto(rnd);
	}

	initThree() {
		// scene
		this.scene = new THREE.Scene();

		// camera
		this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
		this.camera.position.z = 300;
		this.scene.add(new THREE.PointLight(0xffffff, 6));
		// renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

		// clock
		this.clock = new THREE.Clock(true);
	}

	initControls() {
		this.interactive = new InteractiveControls(this.camera, this.renderer.domElement);
	}

	initParticles() {
		this.particles = new Particles(this);
		this.scene.add(this.particles.container);
	}

	addListeners() {
		// this.renderer.domElement.addEventListener('pointerdown', this.mouseDown.bind(this), false);
		// this.renderer.domElement.addEventListener('pointerup', this.mouseUp.bind(this), false);
	}

	mouseDown(event) {

		let _this = this;
		this.mousedown = true;
	}

	mouseUp(event) {

		let _this = this;
		// console.log("intersect", this.scene.children[0].children[0])
		// let intersections = this.getIntersections(event);
		// if (intersections.length > 0) {
		// 	console.log("intersect", intersections[0], this.scene.children[0].children)
		// }
		setTimeout(function () { _this.mousedown = false; }, 2000);

	}


	getIntersections(event) {

		// get intersection point when mouse click on the surface of model
		var width = document.body.clientWidth;
		var height = document.body.clientHeight;
		var vector = new THREE.Vector2();
		vector.set(
			(event.clientX / width) * 2 - 1,
			-(event.clientY / height) * 2 + 1
		);
		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(vector, this.camera);
		var intersects = raycaster.intersectObjects([this.scene.children[0].children[0]], true);
		// var intersects = raycaster.intersectObjects(this.objects.mainObject.scene.children, true);
		return intersects;

	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {
		const delta = this.clock.getDelta();

		if (this.particles) this.particles.update(delta);
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}


	goto(index) {
		// init next
		if (this.currSample == null) this.particles.init(this.samples[index]);
		// hide curr then init next
		else {
			this.particles.hide(true).then(() => {
				this.particles.init(this.samples[index]);
			});
		}

		this.currSample = index;
	}

	next() {
		if (this.currSample < this.samples.length - 1) this.goto(this.currSample + 1);
		else this.goto(0);
	}

	// ---------------------------------------------------------------------------------------------
	// EVENT HANDLERS
	// ---------------------------------------------------------------------------------------------

	resize() {
		if (!this.renderer) return;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		if (this.interactive) this.interactive.resize();
		if (this.particles) this.particles.resize();
	}
}
