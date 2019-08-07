SystemJS.config({
    baseURL: '..', 
    map: {
        src: 'build/src', 
        sinon: 'node_modules/sinon/pkg/sinon.js'
    }, 
	packages: {
		src: {
			defaultExtension: 'js'
		}
	}
})