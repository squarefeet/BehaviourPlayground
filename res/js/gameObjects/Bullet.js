var Bullet = GameObject.extend({
	initialize: function(pos, speed, collidesWith) {
		var bulletMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000
		});
		var bulletGeometry = new THREE.CubeGeometry(1, 1, 1);

		this.object = new THREE.Mesh( bulletGeometry, bulletMaterial );

		this.object.position = pos.clone();

		this.renderables.push(this.object);

		this.origin = new THREE.Vector3();
		
		this.speed = speed || 2;
		this.collidesWith = collidesWith || [];
	},

	tick: function() {

		if(this.object.position.distanceTo(this.origin) < 200) {
			this.object.translateZ(this.speed);
		}
		else {
			this.remove(this.object);
		}

		for(var i = 0, il = this.collidesWith.length; i < il; ++i) {
			if(this.collidesWith[i].active && this.object.position.distanceTo( this.collidesWith[i].object.position ) < 1) {
				this.collidesWith[i].onImpact();
				this.remove(this.object);
				break;
			}
		}
	}
});