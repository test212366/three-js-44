import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'

import matcap from './download (2).png'
import matcap1 from './download.png'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0xeeeeee, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.001,
			 1000
		)
 
		this.camera.position.set(0, 0, 2) 
	 
		this.time = 0

		const frusumSize = 1
		const aspect = this.width / this.height
		this.camera = new THREE.OrthographicCamera(frusumSize  / -2, frusumSize / 2, frusumSize / 2, frusumSize / -2, -1000, 1000)
		this.camera = new THREE.PerspectiveCamera( 70,
			this.width / this.height,
			0.01,
			10
		)
	
		this.camera.position.set(0,0,2)
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.mouseEvents()	
		this.settings()
	}
	mouseEvents() {
		
		this.mouse = new THREE.Vector2()
		document.addEventListener('mousemove', (e) => {
			this.mouse.x = e.pageX / this.width - 0.5
			this.mouse.y = - e.pageY / this.height + 0.5

		})
	}


	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 1
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				uMouse: {value: new THREE.Vector2(0,0)},
				matcap: {value: new THREE.TextureLoader().load(matcap)},
				matcap1: {value: new THREE.TextureLoader().load(matcap1)},
				progress: {value: 0},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			side: THREE.DoubleSide,
			fragmentShader
		})
		
		const front = Math.tan(Math.PI / 6)
		const back = Math.cos(Math.PI / 6)
		const vertices = [
		  0, 1, 0, // 0: top
		  1, 0, front, // 1: right
		  -1, 0, front, // 2: left
		  0, 0, -back, // 3: back middle
		  0, -1, 0, // 4: bottom
		]
		const faces = [
		  2, 1, 0, // left, right, top
		  1, 3, 0, // right, back, top
		  3, 2, 0, // back, left, top
		  2, 4, 1, // left, bottom, right
		  1, 4, 3, // right, bottom, back
		  3, 4, 2, // back, bottom, left
		]
		const geometry = new THREE.PolyhedronGeometry(vertices, faces, 30, 0)


		this.geometry = new THREE.CircleGeometry(2,2)
		this.plane = new THREE.Mesh(this.geometry, this.material)
		// this.plane.scale.set(0.009,0.009,0.009)
 
		this.scene.add(this.plane)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.material.uniforms.time.value = this.time
		 if(this.mouse)this.material.uniforms.uMouse.value = this.mouse
		 this.material.uniforms.progress.value = this.settings.progress
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 