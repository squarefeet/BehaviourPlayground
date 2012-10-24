var Box = GameObject.extend({


	initialize: function(type, pos, size, boxes) {

		this.size = size || 3;

		this.type = type;
		this.boxes = boxes;


		this.material = new THREE.MeshBasicMaterial({
			color: (type === 'friendly' ? 0x00FF00 : type === 'defendPoint' ? 0x8888E1 : 0XFF0000),
			wireframe: !true
		});

		this.geometry = new THREE.CubeGeometry( this.size, this.size, this.size );

		this.object = new THREE.Mesh( this.geometry, this.material );

		this.axis = new THREE.AxisHelper();
		this.axis.scale.set(0.05, 0.05, 0.05);

		this.object.add(this.axis);

		if(pos) {
			this.object.position = pos;
		}

		this.renderables.push( this.object );


		this.maxSpeed = 1;
		this.maxSteerForce = this.maxSpeed / 100;

		this.acceleration = new THREE.Vector3(0, 0, 0);
		this.velocity = new THREE.Vector3(0, 0, 0);

		this.goal = new THREE.Vector3(0, 0, -100);

		this.weaponRange = 100;
		this.fireRate = 100;
		this.lastFired = Date.now();

		

		var that = this;

		setTimeout(function() {
			that.setGoal.call(that);
		}, 1000);
	},

	setGoal: function() {
		var that = this;

		if(this.type === 'friendly') {
			that.goal = that.boxes.defendPoint.object.position;
		}
		else {
			that.goal = that.boxes.friendly[
				(Math.round( Math.random() * that.boxes.friendly.length-1 ))
			].object.position;
		}
	},


	behaviours: {

		reach: function ( target, amount, pos ) {
			var steer = new THREE.Vector3();

			steer.sub( target, pos );
			steer.multiplyScalar( amount );

			return steer;
		},

		separation: function ( box, entities, radius ) {
			var boid, distance,
			posSum = new THREE.Vector3(),
			repulse = new THREE.Vector3();

			for ( var i = 0, il = entities.length; i < il; i ++ ) {

				if ( Math.random() > 0.6 ) continue;

				boid = entities[ i ];
				distance = boid.object.position.distanceTo( box.object.position );

				if ( distance > 0 && distance <= radius ) {

					repulse.sub( box.object.position, boid.object.position );
					repulse.normalize();
					repulse.divideScalar( distance );
					posSum.addSelf( repulse );

				}

			}

			return posSum;
		},


		alignment: function ( box, entities, radius ) {

			var boid, velSum = new THREE.Vector3(),
			count = 0;

			for ( var i = 0, il = entities.length; i < il; i++ ) {
				if ( Math.random() > 0.6 ) continue;

				boid = entities[ i ];

				distance = boid.object.position.distanceTo( box.object.position );

				if ( distance > 0 && distance <= radius ) {
					velSum.addSelf( boid.velocity );
					count++;
				}
			}


			if ( count > 0 ) {
				velSum.divideScalar( count );

				var l = velSum.length();

				if ( l > box.maxSteerForce ) {
					velSum.divideScalar( l / box.maxSteerForce );
				}
			}

			return velSum;
		},


		repulse: function ( box, target ) {

			var distance = box.object.position.distanceTo( target );
			var steer = new THREE.Vector3();

			if ( distance < 10 ) {
				steer.sub( box.object.position, target );
				steer.multiplyScalar( 0.5 / distance );
			}

			return steer;
		}

	},


	update: function() {
		this.velocity.addSelf( this.acceleration );

		var l = this.velocity.length();

		if ( l > this.maxSpeed ) {
            this.velocity.divideScalar( l / this.maxSpeed );
		}

		this.object.position.addSelf( this.velocity );
		this.acceleration.set( 0, 0, 0 );


		this.object.rotation.y = Math.atan2( - this.velocity.z, this.velocity.x );
		
		if(this.velocity.y) {
			this.object.rotation.z = Math.asin( this.velocity.y / this.velocity.length() );
		}
	},


	utils: {
		findNearest: function(box, entities, range) {
			var min = Number.POSITIVE_INFINITY,
				newMin,
				nearest = null;

			for(var i = 0, il = entities.length; i < il; ++i) {

				if(!entities[i].active) continue;

				newMin = Math.min( box.object.position.distanceTo(entities[i].object.position), min );

				entities[i].object.material.color.setHex(0xFF0000);

				if(newMin < range && newMin < min) {
					min = newMin;
					nearest = entities[i];
				}

			}

			return nearest;

		}
	},


	fireAt: function(entity) {
		this.object.lookAt(entity.object.position);

		if(Date.now() - this.lastFired > this.fireRate) {
			this.lastFired = Date.now();

			var bullet = new Bullet(
				this.object.position, // starting vector
				3, // speed
				[].concat(this.boxes['enemy'], this.boxes['friendly']) // collidesWith
			);

			bullet.object.lookAt(entity.object.position);

			setTimeout(function() {
				sceneManager.addObjectTo('middleground', bullet);
			}, 0);
		}
	},

	onImpact: function() {
		this.active = false;
		this.remove(this.object);


		for(var i = 0; i < this.boxes[this.type].length; ++i) {

			if(this.boxes[this.type][i] === this) {
				this.boxes[this.type].splice(i, 1);
				console.log('removing the dead.', this.boxes[this.type].length, this.type, 'ships left.' );
				break;
			}
		}
	},


	tick: function() {

		// If this box is a defend point, don't do anything. We want 
		// defend points to be static.
		if(this.type === 'defendPoint') {
			var nearest = this.utils.findNearest(this, this.boxes['enemy'], this.weaponRange);

			if(nearest) {
				this.target = nearest.object.position;
				nearest.object.material.color.setHex(0x0000FF);
				this.fireAt(nearest);
			}
		}

		else if(this.type === 'friendly') {

			// Attack
			// if(this.boxes.friendly.length > this.boxes.enemy.length && this.boxes.enemy.length) {

				// if(!this.status || this.status === 'defending') {
				// 	this.goal = this.boxes.enemy[
				// 		(Math.round( Math.random() * this.boxes.enemy.length-1 ))
				// 	].object.position;

				// 	this.status = 'attacking';
				// }

				this.acceleration.addSelf( 
					this.behaviours.reach( this.goal, 0.001, this.object.position ) 
				);

				this.acceleration.addSelf( 
					this.behaviours.separation( this, this.boxes['friendly'], 50 ) 
				);

				this.acceleration.addSelf(
					this.behaviours.repulse( this, this.boxes.defendPoint.object.position )
				);

				this.acceleration.addSelf( 
					this.behaviours.alignment( this, this.boxes['friendly'], this.boxes.defendPoint.size * 10 ) 
				);

			// }

			// else if(!this.boxes.enemy.length) {
			// 	this.acceleration.addSelf( 
			// 		this.behaviours.reach( this.boxes.defendPoint.size, 0.001, this.object.position ) 
			// 	);
			// 	this.maxSpeed = 0.1;
			// }

			// Defend!
			// else { 

				// this.status = 'defending';

				// this.acceleration.addSelf( 
				// 	this.behaviours.reach( this.goal, 0.001, this.object.position ) 
				// );

				// this.acceleration.addSelf(
				// 	this.behaviours.repulse( this, this.boxes.defendPoint.object.position )
				// );

				// this.acceleration.addSelf( 
				// 	this.behaviours.separation( this, this.boxes['friendly'], this.boxes.defendPoint.size * 10) 
				// );

				// this.acceleration.addSelf(
				// 	this.behaviours.alignment( this, this.boxes['friendly'], this.boxes.defendPoint.size * 5)
				// );
			// }

		}
		else {

			this.acceleration.addSelf( 
				this.behaviours.reach( this.goal, 0.001, this.object.position ) 
			);

			this.acceleration.addSelf( 
				this.behaviours.separation( this, this.boxes['enemy'], 50 ) 
			);

			this.acceleration.addSelf(
				this.behaviours.repulse( this, this.boxes.defendPoint.object.position )
			);

			this.acceleration.addSelf( 
				this.behaviours.alignment( this, this.boxes['enemy'], this.boxes.defendPoint.size * 10 ) 
			);
		}



		this.update();
	}

});