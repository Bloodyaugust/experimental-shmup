/*! experimentalSHMUP 31-01-2014 */
function logPlay(){_gaq.push(["_trackEvent","Button","Play"])}function start(){var a=new Date;window.app=new SL.Game({canvas:document.getElementById("GameCanvas")}),app.camera=new SL.Camera(app.sctx,new SL.Vec2(400,300)),app.assetCollection=new SL.AssetCollection("res/assets.json",app,function(){_gaq.push(["_trackEvent","Game","Load","",(new Date-a)/1e3]),$(".canvas-container").append(domjs.build(templates.modal));var b=new SL.Scene("loading",[],function(){});b.addEntity({percentLoaded:0,textLocation:new SL.Vec2(400,300),update:function(){100===app.assetCollection.getLoadedPercentage()&&app.transitionScene("menu")},draw:function(a){a.clearRect(0,0,800,600),app.camera.drawText({location:app.screenSize.getScaled(.5),align:"center",text:app.assetCollection.getLoadedPercentage().toFixed()+"%",color:"green",font:"72px Arial"})}});var c=new SL.Scene("menu",[],function(){var a=$(".modal");a.append(domjs.build(templates.menu)),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))})}),d=new SL.Scene("settings",[],function(){var a=$(".modal");a.append(domjs.build(templates.settings)),$(".menu .button").on("click",function(){var b=$(this).attr("id");"menu"===b&&(a.empty(),a.off(),app.transitionScene(b))}),app.currentScene.addEntity({update:function(){},draw:function(a){a.clearRect(0,0,800,600)}})}),e=new SL.Scene("about",[],function(){var a=$(".modal");a.append(domjs.build(templates.about)),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))}),app.currentScene.addEntity({update:function(){},draw:function(a){a.clearRect(0,0,800,600)}})}),f=new SL.Scene("game",[],function(){var a=app.assetCollection.getImage("bg-1");app.currentScene.addEntity({update:function(){},draw:function(){app.camera.drawImage({image:a,location:new SL.Vec2(0,0)})}}),test()});app.addScene(b),app.addScene(c),app.addScene(f),app.addScene(d),app.addScene(e),app.transitionScene("loading"),app.start()})}function Ship(a){var b=this,c=app.assetCollection.assets.blueprints[a.blueprint];c.ship=b,b.blueprint=new Blueprint(c),b.messageBus={ENGINE:[],BLASTER:[],ATTITUDE:[],TARGET:[]},b.collider=new SL.Circle(a.location,b.blueprint.size),b.rotation=90,b.velocity=new SL.Vec2(0,0),b.angularVelocity=0,b.totalEngineImpulse=0,b.weight=b.blueprint.weight,b.update=function(){var a;for(var c in b.messageBus){for(var d=0;d<b.messageBus[c].length;d++)for(var e=0;e<b.blueprint.slots.length;e++)c===b.blueprint.slots[e].type&&b.blueprint.slots[e].module&&b.blueprint.slots[e].module.message(b.messageBus[c][d]);b.messageBus[c]=[]}for(b.blueprint.update(),c=0;c<b.blueprint.slots.length;c++)b.blueprint.slots[c].module&&b.blueprint.slots[c].module.update();a=b.velocity.getScaled(-1).getNormal().getScaled(1/((b.velocity.magnitude()+1)*(b.weight/1e3))),b.velocity.translate(a.getScaled(app.deltaTime)),b.collider.origin.translate(b.velocity.getScaled(app.deltaTime)),b.angularVelocity+=-b.angularVelocity/ANGULAR_DRAG_MODIFIER*(b.weight/100),b.rotation+=b.angularVelocity*app.deltaTime},b.draw=function(){app.camera.drawCircle({origin:b.collider.origin,radius:b.collider.radius,lineColor:"red",lineWidth:2}),b.blueprint.draw();for(var a=0;a<b.blueprint.slots.length;a++)b.blueprint.slots[a].module&&b.blueprint.slots[a].module.draw();app.camera.drawText({text:b.velocity.x.toFixed(2)+"  "+b.velocity.y.toFixed(2),location:b.collider.origin.getTranslated(new SL.Vec2(0,40)),align:"center"}),app.camera.drawText({text:b.angularVelocity.toFixed(2),location:b.collider.origin.getTranslated(new SL.Vec2(0,55)),align:"center"})},b.message=function(a,c){b.messageBus[a].push(c)},b.setSlotModule=function(a,c){a.isModuleCompatible(c)&&(a.module?b.weight-a.module.weight+c.weight<=b.blueprint.maxWeight&&(b.weight=b.weight-a.module.weight+c.weight,a.module=c,a.module.ship=b,a.module.slot=a):b.weight+c.weight<=b.blueprint.maxWeight&&(b.weight=b.weight+c.weight,a.module=c,a.module.ship=b,a.module.slot=a))},b.impulse=function(a){var c=a.getScaled(1/b.weight);b.velocity.translate(c)},b.angularImpulse=function(a){b.angularVelocity+=a*(1/b.weight)}}function Blueprint(a){var b,c=this;for(var d in a)c[d]=a[d];for(b=c.slots,c.slots=[],d=0;d<b.length;d++)c.slots.push(new Slot(b[d])),c.slots[d].blueprint=c;for(c.maxSpeed=0,d=0;d<c.slots.length;d++)"ENGINE"===c.slots[d].type&&(c.maxSpeed+=BASE_ENGINE_SPEED);c.image=app.assetCollection.getImage(c.name+"-hull.png"),c.update=function(){},c.draw=function(){app.camera.drawImage({image:c.image,location:c.ship.collider.origin,angle:c.ship.rotation})}}function Slot(a){var b=this;for(var c in a)b[c]=a[c];b.location=new SL.Vec2(b.location.x,b.location.y),b.module=null,b.isModuleCompatible=function(a){return"DYNAMIC"===b.type||b.type===a.type}}function Module(a){var b=this,c=function(){b.BLASTER=function(){b.timeToFire=0,b.currentClip=b.clip,b.state="IDLE",b.update=function(){for(var a=0;a<b.messages.length;a++)"FIRE"===b.messages[a]&&"IDLE"===b.state&&(b.state="FIRING");b.messages=[],"IDLE"!==b.state&&("RELOAD"===b.state&&(b.timeToFire-=app.deltaTime,b.timeToFire<=0&&(b.timeToFire=0,b.currentClip=b.clip,b.state="IDLE")),"FIRING"===b.state&&b.currentClip>0&&(b.timeToFire>0?b.timeToFire-=app.deltaTime:(b.currentClip--,b.timeToFire=b.fireInterval,b.fire(),b.currentClip<1&&(b.state="RELOAD",b.timeToFire=b.reloadTime))))},b.draw=function(){app.camera.drawImage({image:b.image,location:b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),angle:b.ship.rotation})},b.fire=function(){}},b.ENGINE=function(){b.state="IDLE",b.update=function(){for(var a=0;a<b.messages.length;a++)"TOGGLE"===b.messages[a]&&(b.state="IDLE"===b.state?"IMPULSE":"IDLE");b.messages=[],"IMPULSE"===b.state&&b.ship.impulse(new SL.Vec2(0,0).translateAlongRotation(b.impulse,b.ship.rotation).scale(b.impulse))},b.draw=function(){app.camera.drawImage({image:b.image,location:b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),angle:b.ship.rotation})}},b.UTILITY=function(){b.update=function(){},b.draw=function(){}},b.ATTITUDE=function(){b.state=0,b.update=function(){for(var a=0;a<b.messages.length;a++)b.state=parseInt(b.messages[a]);b.messages=[],b.state>0&&b.ship.angularImpulse(1===b.state?b.impulse:-b.impulse)},b.draw=function(){app.camera.drawCircle({origin:b.ship.collider.origin.getTranslated(b.slot.location).rotate(b.ship.collider.origin,b.ship.rotation),radius:3,lineColor:"green"})}},b[b.type]()};for(var d in a)b[d]=a[d];b.image=app.assetCollection.getImage(b.name),b.messages=[],b.message=function(a){b.messages.push(a)},c(b)}function test(){var a=new Ship({blueprint:"fighter",location:new SL.Vec2(0,0)}),b=new Ship({blueprint:"fighter",location:new SL.Vec2(100,0)});a.testID=0,b.testID=1,a.setSlotModule(a.blueprint.slots[0],new Module(app.assetCollection.assets.modules.BLASTER.fighter)),a.setSlotModule(a.blueprint.slots[1],new Module(app.assetCollection.assets.modules.ENGINE.fighter)),a.setSlotModule(a.blueprint.slots[2],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter)),a.setSlotModule(a.blueprint.slots[3],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter)),b.setSlotModule(b.blueprint.slots[0],new Module(app.assetCollection.assets.modules.BLASTER.fighter)),b.setSlotModule(b.blueprint.slots[1],new Module(app.assetCollection.assets.modules.ENGINE.fighter)),b.setSlotModule(b.blueprint.slots[2],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter)),b.setSlotModule(b.blueprint.slots[3],new Module(app.assetCollection.assets.modules.ATTITUDE.fighter)),app.currentScene.addEntity(a),app.currentScene.addEntity(b)}SL=sugarLab;var CAMERA_OFFSET=new SL.Vec2(0,0),BASE_ENGINE_SPEED=50,ANGULAR_DRAG_MODIFIER=10;