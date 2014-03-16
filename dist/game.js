/*! experimentalSHMUP 15-03-2014 */
function logPlay(){_gaq.push(["_trackEvent","Button","Play"])}function start(){var a=new Date;window.app=new SL.Game({canvas:document.getElementById("GameCanvas")}),app.camera=new SL.Camera(app.sctx,SCREEN_SIZE.getScaled(.5)),app.assetCollection=new SL.AssetCollection("res/assets.json",app,function(){_gaq.push(["_trackEvent","Game","Load","",(new Date-a)/1e3]),$(".canvas-container").append(domjs.build(templates.modal));var b=new SL.Scene("loading",[],function(){});b.addEntity({percentLoaded:0,textLocation:new SL.Vec2(0,0),update:function(){100===app.assetCollection.getLoadedPercentage()&&app.transitionScene("menu")},draw:function(a){a.clearRect(0,0,SCREEN_SIZE.x,SCREEN_SIZE.y),app.camera.drawText({location:this.textLocation,align:"center",text:app.assetCollection.getLoadedPercentage().toFixed()+"%",color:"green",font:"72px Arial"})}});var c=new SL.Scene("menu",[],function(){var a=$(".modal");a.append(domjs.build(templates.menu)),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))})}),d=new SL.Scene("settings",[],function(){var a=$(".modal");a.append(domjs.build(templates.settings)),$(".menu .button").on("click",function(){var b=$(this).attr("id");"menu"===b&&(a.empty(),a.off(),app.transitionScene(b))}),app.currentScene.addEntity({update:function(){},draw:function(a){a.clearRect(0,0,800,600)}})}),e=new SL.Scene("about",[],function(){var a=$(".modal");a.append(domjs.build(templates.about)),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))}),app.currentScene.addEntity({update:function(){},draw:function(a){a.clearRect(0,0,800,600)}})}),f=new SL.Scene("game",[],function(){var a=app.assetCollection.getImage("bg-1");app.currentScene.addEntity({lastTeam:50,timeToSwitch:CAMERA_SWITCH_TIME,currentShip:null,update:function(){var a,b=app.currentScene.getEntitiesByTag("SHIP"),c=b.filter(function(a){return"fighter"===a.blueprint.name}),d=b.filter(function(a){return"corvette"===a.blueprint.name});this.timeToSwitch-=app.deltaTime,(this.timeToSwitch<=0||null===this.currentShip||this.currentShip.dead||null===this.currentShip.dead)&&(this.timeToSwitch=CAMERA_SWITCH_TIME,this.currentShip=b[Math.floor(Math.random()*b.length)]),a=SCREEN_SIZE.getScaled(.5).translate(this.currentShip.collider.origin.getScaled(-1)),app.camera.offset.translate(app.camera.offset.getDirectionVector(a).getScaled(SL.Tween.quadIn(CAMERA_MOVE_SPEED,app.camera.offset.distance(a)/CAMERA_OUTER_DISTANCE)));for(var e=c.length;20>e;e++)createEasyFighter({team:++this.lastTeam,location:new SL.Vec2(1e3,1e3).randomize()});for(e=d.length;5>e;e++)createEasyCorvette({team:++this.lastTeam,location:new SL.Vec2(1e3,1e3).randomize()})},draw:function(){var b=new SL.Vec2(0,0);this.currentShip&&null!==this.currentShip.dead&&(b=this.currentShip.collider.origin.clone()),app.camera.drawImage({image:a,location:b})},zIndex:0}),app.currentScene.addEntity({update:function(){},draw:function(){app.camera.drawText({text:"FPS: "+app.fps,color:"red",location:app.camera.offset.getScaled(-1).translate(new SL.Vec2(5,15))})},zIndex:5}),test()});app.addScene(b),app.addScene(c),app.addScene(f),app.addScene(d),app.addScene(e),app.transitionScene("loading"),app.start()})}function Ship(a){var b=this,c=app.assetCollection.assets.blueprints[a.blueprint];b.tag="SHIP",c.ship=b,b.blueprint=new Blueprint(c),b.dead=!1,b.messageBus={ENGINE:[],BLASTER:[],TURRET:[],MISSILE:[],ATTITUDE:[],TARGET:[],COLLISION:[]},b.collider=new SL.Circle(a.location,b.blueprint.size),b.rotation=90,b.totalEngineSpeed=0,b.totalAttitudeSpeed=0,b.velocity=new SL.Vec2(0,0),b.angularVelocity=0,b.momentum=0,b.angularMomentum=0,b.weight=b.blueprint.weight,b.integrity=1,b.baseArmor=b.blueprint.baseArmor,b.armor=b.baseArmor,b.team=a.team||0,b.target=null,b.zIndex=1,b.update=function(){var a;for(c=0;c<b.messageBus.COLLISION.length;c++)b.evaluateCollision(b.messageBus.COLLISION[c]),b.evaluateIntegrity();for(c=0;c<b.messageBus.TARGET.length;c++)b.target=b.messageBus.TARGET[c];for(var c in b.messageBus){for(var d=0;d<b.messageBus[c].length;d++)for(var e=0;e<b.blueprint.slots.length;e++)b.blueprint.slots[e].module&&c===b.blueprint.slots[e].module.type&&b.blueprint.slots[e].module.message(b.messageBus[c][d]);b.messageBus[c]=[]}for(b.blueprint.update(),c=0;c<b.blueprint.slots.length;c++)b.blueprint.slots[c].module&&b.blueprint.slots[c].module.update();a=SL.Tween.quadIn(b.totalEngineSpeed/(b.weight/MAX_SPEED_WEIGHT_MODIFIER),b.momentum/(b.weight*MOMENTUM_PER_TON)),b.velocity=SL.Vec2.fromPolar(a,b.rotation),b.collider.origin.translate(b.velocity.getScaled(app.deltaTime)),b.angularVelocity=SL.Tween.quartOut(b.totalAttitudeSpeed/(b.weight/MAX_SPEED_WEIGHT_MODIFIER),Math.abs(b.angularMomentum)/(b.weight*MOMENTUM_PER_TON))*SL.sign(b.angularMomentum),b.rotation+=b.angularVelocity*app.deltaTime,b.rotation=SL.wrapAngle(b.rotation),b.momentum-=MOMENTUM_DECAY_RATE*app.deltaTime,b.momentum=SL.clamp(b.momentum,0,b.weight*MOMENTUM_PER_TON),b.angularMomentum=SL.decayToZero(b.angularMomentum,MOMENTUM_DECAY_RATE*(b.weight/WEIGHT_DRAG_MODIFIER)*app.deltaTime),b.angularMomentum=SL.clamp(b.angularMomentum,-(b.weight*MOMENTUM_PER_TON),b.weight*MOMENTUM_PER_TON),b.dead&&app.currentScene.removeEntity(b)},b.draw=function(){b.blueprint.draw();for(var a=0;a<b.blueprint.slots.length;a++)b.blueprint.slots[a].module&&b.blueprint.slots[a].module.draw()},b.message=function(a,c){b.messageBus[a].push(c)},b.setSlotModule=function(a,c){a.isModuleCompatible(c)&&(a.module&&a.module.removeFromShip(),c.addToShip(b,a),b.weight>b.blueprint.maxWeight&&a.module.removeFromShip())},b.setModuleProjectile=function(a,b){a.isProjectileCompatible(b)&&(a.projectile=b)},b.impulse=function(a){b.momentum+=a*app.deltaTime},b.angularImpulse=function(a){b.angularMomentum+=a*app.deltaTime},b.evaluateCollision=function(a){var c=SL.Tween.quadIn(a.damage,a.penetration/b.armor);b.integrity-=c/b.weight},b.evaluateIntegrity=function(){var a=SL.Tween.quadInOut(1,b.integrity);Math.random()>=a&&(b.dead=!0)}}function Blueprint(a){var b,c=this;for(var d in a)c[d]=a[d];for(b=c.slots,c.slots=[],d=0;d<b.length;d++)c.slots.push(new Slot(b[d])),c.slots[d].blueprint=c;c.image=app.assetCollection.getImage(c.name+"-hull.png"),c.update=function(){},c.draw=function(){app.camera.drawImage({image:c.image,location:c.ship.collider.origin,angle:c.ship.rotation})}}function Slot(a){var b=this;for(var c in a)b[c]=a[c];b.location=new SL.Vec2(b.location.x,b.location.y),b.module=null,b.isModuleCompatible=function(a){return"DYNAMIC"===b.type||b.type===a.type}}function Module(a){var b=this,c=function(){b.BLASTER=function(){b.timeToFire=0,b.currentClip=b.clip,b.state="IDLE",b.update=function(){for(var a=0;a<b.messages.length;a++)"FIRE"===b.messages[a]&&"IDLE"===b.state&&(b.state="FIRING");b.messages=[],"IDLE"!==b.state&&("RELOAD"===b.state&&(b.timeToFire-=app.deltaTime,b.timeToFire<=0&&(b.timeToFire=0,b.currentClip=b.clip,b.state="IDLE")),"FIRING"===b.state&&b.currentClip>0&&(b.timeToFire>0?b.timeToFire-=app.deltaTime:(b.currentClip--,b.timeToFire=b.fireInterval,b.fire(),b.currentClip<1&&(b.state="RELOAD",b.timeToFire=b.reloadTime))))},b.draw=function(){app.camera.drawImage({image:b.image,location:b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),angle:b.ship.rotation})},b.fire=function(){var a=new Projectile(b.projectile);a.collider=new SL.Circle(b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),a.size),a.angle=b.ship.rotation,a.velocity=SL.Vec2.fromPolar(1,a.angle).scale(b.power/(a.weight/2)).translate(b.ship.velocity),a.team=b.ship.team,app.currentScene.addEntity(a)}},b.MISSILE=function(){b.timeToFire=0,b.currentClip=b.clip,b.state="IDLE",b.update=function(){for(var a=0;a<b.messages.length;a++)"FIRE"===b.messages[a]&&"IDLE"===b.state&&(b.state="FIRING");b.messages=[],"IDLE"!==b.state&&("RELOAD"===b.state&&(b.timeToFire-=app.deltaTime,b.timeToFire<=0&&(b.timeToFire=0,b.currentClip=b.clip,b.state="IDLE")),"FIRING"===b.state&&b.currentClip>0&&(b.timeToFire>0?b.timeToFire-=app.deltaTime:(b.currentClip--,b.timeToFire=b.fireInterval,b.fire(),b.currentClip<1&&(b.state="RELOAD",b.timeToFire=b.reloadTime))))},b.draw=function(){app.camera.drawImage({image:b.image,location:b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),angle:b.ship.rotation})},b.fire=function(){var a=new Projectile(b.projectile);a.collider=new SL.Circle(b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),a.size),a.angle=b.ship.rotation,a.team=b.ship.team,a.target=b.ship.target,app.currentScene.addEntity(a)}},b.ENGINE=function(){b.state="IDLE",b.update=function(){for(var a=0;a<b.messages.length;a++)"TOGGLE"===b.messages[a]?b.state="IDLE"===b.state?"IMPULSE":"IDLE":("IDLE"===b.messages[a]||"IMPULSE"===b.messages[a])&&(b.state=b.messages[a]);b.messages=[],"IMPULSE"===b.state&&b.ship.impulse(b.impulse)},b.draw=function(){app.camera.drawImage({image:b.image,location:b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),angle:b.ship.rotation})}},b.UTILITY=function(){b.update=function(){},b.draw=function(){}},b.ARMOR=function(){b.update=function(){},b.draw=function(){}},b.ATTITUDE=function(){b.state=0,b.update=function(){for(var a=0;a<b.messages.length;a++)b.state=parseInt(b.messages[a]);b.messages=[],0!==b.state&&b.ship.angularImpulse(1===b.state?b.impulse:-b.impulse)},b.draw=function(){}},b.isProjectileCompatible=function(a){return b.projectileType===a.type},b[b.type]()};for(var d in a)b[d]=a[d];b.addToShip=function(a,c){b.ship=a,b.slot=c,b.slot.module=b,b.ship.weight+=b.weight,b.armor?b.ship.armor+=b.armor:null,b.speed&&("ENGINE"===b.type?b.ship.totalEngineSpeed+=b.speed:b.ship.totalAttitudeSpeed+=b.speed)},b.removeFromShip=function(){b.speed&&("ENGINE"===b.type?b.ship.totalEngineSpeed-=b.speed:b.ship.totalAttitudeSpeed-=b.speed),b.armor?b.ship.armor-=b.armor:null,b.ship.weight-=b.weight,b.ship=null,b.slot.module=null},b.image=app.assetCollection.getImage(b.name),b.messages=[],b.message=function(a){b.messages.push(a)},c()}function Projectile(a){var b=this;for(var c in a)b[c]=a[c];b.zIndex=2,b.image=app.assetCollection.getImage("img/projectiles/"+b.name);var d=function(){b.SLUG=function(){b.maxMomentum=b.weight*MOMENTUM_PER_TON,b.momentum=b.maxMomentum,b.update=function(){var a,c=app.currentScene.getEntitiesByTag("SHIP");if(b.momentum-=app.deltaTime*MOMENTUM_POUND_DECAY_RATE,a=SL.Tween.quartOut(1,b.momentum/b.maxMomentum),a>MOMENTUM_SLUG_MINIMUM){b.collider.origin.translate(b.velocity.getScaled(app.deltaTime));for(var d=0;d<c.length;d++)if(c[d].team!==b.team&&b.collider.intersects(c[d].collider)){c[d].message("COLLISION",{damage:b.damage,penetration:b.penetration}),app.currentScene.removeEntity(b);break}}else app.currentScene.removeEntity(b)},b.draw=function(){app.camera.drawImage({image:b.image,location:b.collider.origin,angle:b.angle})}},b.MISSILE=function(){b.momentum=0,b.update=function(){if(null===b.target.dead||b.target.dead)app.currentScene.removeEntity(b);else{var a=app.currentScene.getEntitiesByTag("SHIP"),c=b.target.collider.origin.angleBetween(b.collider.origin);b.momentum<1?b.momentum+=app.deltaTime:null,b.angle+=b.rotationSpeed*SL.rotateLeftRight(b.angle,c)*app.deltaTime,b.angle=SL.wrapAngle(b.angle),b.collider.origin.translateAlongRotation(SL.Tween.quadIn(b.speed,b.momentum)*app.deltaTime,b.angle);for(var d=0;d<a.length;d++)if(a[d].team!==b.team&&b.collider.intersects(a[d].collider)){a[d].message("COLLISION",{damage:b.damage,penetration:b.penetration}),app.currentScene.removeEntity(b);break}}},b.draw=function(){app.camera.drawImage({image:b.image,location:b.collider.origin,angle:b.angle})}},b[b.type]()};d()}function AI(a){var b=this;b.ship=a.ship,b.team=a.team,b.type=a.type,b.target=null,b.disabled=!1,b.update=a.update?a.update.bind(b):b.update,b.draw=a.draw?a.draw.bind(b):b.draw,app.currentScene.addEntity(b)}function EasyAI(){var a,b=this,c=10,d=300;AI.prototype.update.call(b),!b.disabled&&b.target&&(a=SL.wrapAngle(b.ship.collider.origin.angleBetween(b.target.collider.origin)+180),b.ship.message("ATTITUDE",SL.rotateLeftRight(b.ship.rotation,a)),b.ship.collider.origin.distance(b.target.collider)<=d?b.ship.message("ENGINE","IDLE"):b.ship.message("ENGINE","IMPULSE"),Math.abs(a-b.ship.rotation)<=c&&b.ship.message("BLASTER","FIRE"),b.ship.message("MISSILE","FIRE")),AI.prototype.lateUpdate.call(b)}function createEasyFighter(a){var b=new Ship({blueprint:"fighter",location:a.location,team:a.team});Math.random()>=.5?(b.setSlotModule(b.blueprint.slots[0],new Module(app.assetCollection.assets.modules.BLASTER.fighter)),b.setModuleProjectile(b.blueprint.slots[0].module,new Projectile(app.assetCollection.assets.projectiles.SLUG.uranium)),b.setSlotModule(b.blueprint.slots[1],new Module(app.assetCollection.assets.modules.ENGINE.fighter)),b.setSlotModule(b.blueprint.slots[2],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter)),b.setSlotModule(b.blueprint.slots[3],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter))):(b.setSlotModule(b.blueprint.slots[0],new Module(app.assetCollection.assets.modules.MISSILE.fighter)),b.setModuleProjectile(b.blueprint.slots[0].module,new Projectile(app.assetCollection.assets.projectiles.MISSILE[Math.random()>=.5?"heat":"flak"])),b.setSlotModule(b.blueprint.slots[1],new Module(app.assetCollection.assets.modules.ENGINE.fighter)),b.setSlotModule(b.blueprint.slots[2],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter)),b.setSlotModule(b.blueprint.slots[3],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter))),app.currentScene.addEntity(b),new AI({ship:b,team:a.team,type:"EASY",update:EasyAI})}function createEasyCorvette(a){var b=new Ship({blueprint:"corvette",location:a.location,team:a.team});b.setSlotModule(b.blueprint.slots[0],new Module(app.assetCollection.assets.modules.ENGINE.corvette)),b.setSlotModule(b.blueprint.slots[1],new Module(app.assetCollection.assets.modules.ENGINE.corvette)),b.setSlotModule(b.blueprint.slots[2],new Module(app.assetCollection.assets.modules.ENGINE.corvette)),b.setSlotModule(b.blueprint.slots[3],new Module(app.assetCollection.assets.modules.ENGINE.corvette)),b.setSlotModule(b.blueprint.slots[4],new Module(app.assetCollection.assets.modules.ENGINE.corvette)),b.setSlotModule(b.blueprint.slots[5],new Module(app.assetCollection.assets.modules.MISSILE.fighter)),b.setModuleProjectile(b.blueprint.slots[5].module,new Projectile(app.assetCollection.assets.projectiles.MISSILE[Math.random()>=.5?"heat":"flak"])),b.setSlotModule(b.blueprint.slots[6],new Module(app.assetCollection.assets.modules.MISSILE.fighter)),b.setModuleProjectile(b.blueprint.slots[6].module,new Projectile(app.assetCollection.assets.projectiles.MISSILE[Math.random()>=.5?"heat":"flak"])),b.setSlotModule(b.blueprint.slots[7],new Module(app.assetCollection.assets.modules.BLASTER.fighter)),b.setModuleProjectile(b.blueprint.slots[7].module,new Projectile(app.assetCollection.assets.projectiles.SLUG.uranium)),b.setSlotModule(b.blueprint.slots[8],new Module(app.assetCollection.assets.modules.BLASTER.fighter)),b.setModuleProjectile(b.blueprint.slots[8].module,new Projectile(app.assetCollection.assets.projectiles.SLUG.uranium)),b.setSlotModule(b.blueprint.slots[9],new Module(app.assetCollection.assets.modules.ATTITUDE.corvette)),b.setSlotModule(b.blueprint.slots[10],new Module(app.assetCollection.assets.modules.ATTITUDE.corvette)),app.currentScene.addEntity(b),new AI({ship:b,team:a.team,type:"EASY",update:EasyAI})}function test(){for(var a=new SL.Vec2(1e3,1e3),b=0;50>b;b++)createEasyFighter({team:b,location:a.clone().randomize()});for(b=0;5>b;b++)createEasyCorvette({team:b,location:a.clone().randomize()})}SL=sugarLab;var SCREEN_SIZE=new SL.Vec2(800,600),CAMERA_OFFSET=new SL.Vec2(0,0),BASE_ENGINE_SPEED=50,CAMERA_SWITCH_TIME=10,CAMERA_MOVE_SPEED=50,CAMERA_OUTER_DISTANCE=200,MOMENTUM_PER_TON=10,MOMENTUM_DECAY_RATE=200,MOMENTUM_POUND_DECAY_RATE=50,MOMENTUM_SLUG_MINIMUM=.75,WEIGHT_DRAG_MODIFIER=50,MAX_SPEED_WEIGHT_MODIFIER=100;AI.prototype.update=function(){var a=this,b=app.currentScene.getEntitiesByTag("SHIP");void 0===a.ship.dead||null===a.ship.dead||a.ship.dead?a.disabled=!0:(b=b.filter(function(b){return!(b.team===a.team||b.dead)}),a.target&&void 0!==a.target.dead&&null!==a.target.dead||(a.target=b[Math.floor(Math.random()*b.length)]),a.target&&a.ship.message("TARGET",a.target))},AI.prototype.lateUpdate=function(){var a=this;(a.disabled||void 0===a.ship.dead||null===a.ship.dead||a.ship.dead)&&app.currentScene.removeEntity(a)},AI.prototype.draw=function(){};