/*! ld28 26-01-2014 */
function logPlay(){_gaq.push(["_trackEvent","Button","Play"])}function start(){var a=new Date;window.app=new sugarLab.Game({canvas:document.getElementById("GameCanvas")}),app.camera=new sugarLab.Camera(app.sctx,new sugarLab.Vec2(0,0)),app.assetCollection=new sugarLab.AssetCollection("res/assets.json",app,function(){_gaq.push(["_trackEvent","Game","Load","",(new Date-a)/1e3]),$(".canvas-container").append(domjs.build(templates.modal));var b=new sugarLab.Scene("loading",[],function(){});b.addEntity({percentLoaded:0,textLocation:new sugarLab.Vec2(400,300),update:function(){100===app.assetCollection.getLoadedPercentage()&&app.transitionScene("menu")},draw:function(a){a.clearRect(0,0,800,600),app.camera.drawText({location:app.screenSize.getScaled(.5),align:"center",text:app.assetCollection.getLoadedPercentage().toFixed()+"%",color:TEXT_COLOR,font:"72px Arial"})}});var c=new sugarLab.Scene("menu",[],function(){var a=$(".modal");a.append(domjs.build(templates.menu)),app.currentScene.addEntity(new Spartan(!0)),app.currentScene.addEntity(new Spawner),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))}),app.currentScene.addEntity(new Background)}),d=new sugarLab.Scene("settings",[],function(){var a=$(".modal");a.append(domjs.build(templates.settings)),$(".sound-toggle").text(app.assetCollection.assets.settings.sound.toString().toUpperCase()),$(".difficulty-toggle").text(app.assetCollection.assets.settings.difficulty),$(".menu .button").on("click",function(){var b=$(this).attr("id");if("menu"===b)a.empty(),a.off(),app.transitionScene(b);else if("sound"===b)app.assetCollection.assets.settings.sound=!app.assetCollection.assets.settings.sound,$(".sound-toggle").text(app.assetCollection.assets.settings.sound.toString().toUpperCase());else{var c=$(".difficulty-toggle");"EASY"===c.text()?(app.assetCollection.assets.settings.difficulty="MEDIUM",c.text("MEDIUM")):"MEDIUM"===c.text()?(app.assetCollection.assets.settings.difficulty="HARD",c.text("HARD")):(app.assetCollection.assets.settings.difficulty="EASY",c.text("EASY"))}}),app.currentScene.addEntity({update:function(){},draw:function(a){a.clearRect(0,0,800,600)}})}),e=new sugarLab.Scene("about",[],function(){var a=$(".modal");a.append(domjs.build(templates.about)),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))}),app.currentScene.addEntity({update:function(){},draw:function(a){a.clearRect(0,0,800,600)}})}),f=new sugarLab.Scene("game",[],function(){app.currentScene.addEntity(new Spartan(!1)),app.currentScene.addEntity(new Spawner),app.currentScene.addEntity(new Background)});app.addScene(b),app.addScene(c),app.addScene(f),app.addScene(d),app.addScene(e),app.transitionScene("loading"),app.start()})}function Spartan(a){var b,c=this;c.zIndex=2,c.health=5,c.spears=3,c.kills=0,c.tag="spartan",c.moveSpeed=new sugarLab.Vec2(60,0),c.range=80,c.facing=1,c.timeToAttack=ATTACK_INTERVAL,c.state="idle",c.images=[app.assetCollection.getImage("spartan-walk-left.png"),app.assetCollection.getImage("spartan-walk-right.png"),app.assetCollection.getImage("spartan-block-left.png"),app.assetCollection.getImage("spartan-block-right.png"),app.assetCollection.getImage("spartan-idle.png"),app.assetCollection.getImage("spartan-attack-left.png"),app.assetCollection.getImage("spartan-attack-right.png")],b={"walk-left":new sugarLab.Animation({name:"walk-left",playTime:7,sourceImage:c.images[0],frameSize:new sugarLab.Vec2(156,160),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(2028,800)),frameCount:63}),"walk-right":new sugarLab.Animation({name:"walk-right",playTime:7,sourceImage:c.images[1],frameSize:new sugarLab.Vec2(112,150),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1792,600)),frameCount:63}),"block-left":new sugarLab.Animation({name:"block-left",playTime:10,sourceImage:c.images[2],frameSize:new sugarLab.Vec2(95,140),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1995,420)),frameCount:63}),"block-right":new sugarLab.Animation({name:"block-right",playTime:6,sourceImage:c.images[3],frameSize:new sugarLab.Vec2(112,143),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1008,1001)),frameCount:63}),idle:new sugarLab.Animation({name:"idle",playTime:9,sourceImage:c.images[4],frameSize:new sugarLab.Vec2(96,142),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(2016,426)),frameCount:63}),"attack-left":new sugarLab.Animation({name:"attack-left",playTime:8,sourceImage:c.images[5],frameSize:new sugarLab.Vec2(140,145),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1260,1015)),frameCount:63}),"attack-right":new sugarLab.Animation({name:"attack-right",playTime:8,sourceImage:c.images[6],frameSize:new sugarLab.Vec2(124,150),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1984,600)),frameCount:63})},c.animator=new sugarLab.Animator(app,b),c.rect=new sugarLab.Rect(new sugarLab.Vec2(0,300),new sugarLab.Vec2(100,150)),c.update=a?AI.spartan.bind(c):function(){var a,b=this,c=app.assetCollection.assets.keys;b.health>0?(b.timeToAttack-=app.deltaTime,"attack"===b.state&&b.timeToAttack>0||("attack"===b.state&&b.attack(),app.isKeyDown(c.left)?(b.state="walk",b.facing=-1):app.isKeyDown(c.right)?(b.state="walk",b.facing=1):b.state=app.isKeyDown(c.block)?"block":app.isKeyDown(c.attack)?"attack":"idle"),"walk"===b.state&&b.rect.translate(b.moveSpeed.getScaled(b.facing).getScaled(app.deltaTime)),a=b.facing>0?"-right":"-left",a="idle"===b.state?"":a,b.animator.playAnimation(b.state+a),b.animator.update(),app.camera.offset=new sugarLab.Vec2(b.rect.origin.getScaled(-1).getTranslated(CAMERA_OFFSET).x,0)):app.transitionScene("menu")},c.draw=function(a){var b=c.animator.currentAnimation,d=c.animator.getCurrentFrame();sugarLab.drawTextCentered(c.kills,new sugarLab.Vec2(710,50),"red","36px Spatter",a),sugarLab.drawTextCentered(c.kills,new sugarLab.Vec2(700,50),"white","32px Arial Bold",a),app.camera.drawImage({image:b.sourceImage,location:c.rect.location,drawSource:d,drawOrigin:new sugarLab.Vec2(0,0)});for(var e=0;e<c.health;e++)sugarLab.drawText("0",new sugarLab.Vec2(700-20*e,100),"red","36px Spatter",a);sugarLab.drawTextCentered("Kills: ",new sugarLab.Vec2(650,50),"white","32px Arial Bold",a),sugarLab.drawTextCentered("Health: ",new sugarLab.Vec2(550,100),"white","32px Arial Bold",a)},c.attack=function(){for(var a=app.currentScene.getEntitiesByTag("persian"),b=new sugarLab.Rect(c.rect.location.getTranslated(new sugarLab.Vec2(c.range*c.facing,0)),new sugarLab.Vec2(c.range,c.rect.y)),d=0;d<a.length;d++)a[d].rect.intersects(b)&&(a[d].health-=1,a[d].health<=0&&c.kills++);c.timeToAttack=ATTACK_INTERVAL}}function Persian(a){var b,c=this,d=app.assetCollection.assets.settings.difficulty,e=1,f=app.currentScene.getEntitiesByTag("spartan")[0],g=1;Math.random()<.5&&(g*=-1),c.zIndex=1,c.tag="persian",c.facing=1,c.range=a.range,c.enemyType=a.type,c.blocking=!1,c.timeToAttack=ATTACK_INTERVAL,c.state="walk",c.images=[app.assetCollection.getImage(c.enemyType+"-walk-left.png"),app.assetCollection.getImage(c.enemyType+"-walk-right.png"),app.assetCollection.getImage(c.enemyType+"-attack-left.png"),app.assetCollection.getImage(c.enemyType+"-attack-right.png")],b={"walk-left":new sugarLab.Animation({name:"walk-left",playTime:6,sourceImage:c.images[0],frameSize:new sugarLab.Vec2(116,150),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1856,600)),frameCount:63}),"walk-right":new sugarLab.Animation({name:"walk-right",playTime:6,sourceImage:c.images[1],frameSize:new sugarLab.Vec2(108,126),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1728,504)),frameCount:63}),"attack-left":new sugarLab.Animation({name:"attack-left",playTime:6,sourceImage:c.images[2],frameSize:new sugarLab.Vec2(148,156),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1924,780)),frameCount:63}),"attack-right":new sugarLab.Animation({name:"attack-right",playTime:6,sourceImage:c.images[3],frameSize:new sugarLab.Vec2(150,140),sourceRect:new sugarLab.Rect(new sugarLab.Vec2(0,0),new sugarLab.Vec2(1350,980)),frameCount:63})},c.animator=new sugarLab.Animator(app,b),"MEDIUM"===d?e=2:"HARD"===d&&(e=3),c.health=a.health*e,c.moveSpeed=new sugarLab.Vec2(60,0).scale(a.moveSpeed),c.rect=new sugarLab.Rect(f.rect.location.getTranslated(new sugarLab.Vec2(450*g,0)),new sugarLab.Vec2(100,150)),c.update=AI.persian.bind(c),c.draw=function(){var a=c.animator.currentAnimation,b=c.animator.getCurrentFrame();app.camera.drawImage({image:a.sourceImage,location:c.rect.location,drawSource:b,drawOrigin:new sugarLab.Vec2(0,0)})},c.attack=function(){var a=app.currentScene.getEntitiesByTag("spartan")[0];"blocking"===a.state?a.facing===c.facing&&(a.health-=1):a.health-=1,c.timeToAttack=ATTACK_INTERVAL}}function Background(){var a=this,b=new sugarLab.Vec2(1600,600),c=new sugarLab.Vec2(800,600),d=app.camera,e=app.assetCollection.getImage("background.png");a.backgrounds=[{rect:new sugarLab.Rect(new sugarLab.Vec2(0,0),b.clone())},{rect:new sugarLab.Rect(new sugarLab.Vec2(-1600,0),b.clone())}],a.update=function(){for(var e,f=new sugarLab.Rect(d.offset.getScaled(-1),c),g=app.currentScene.getEntitiesByTag("spartan")[0],h=0;h<a.backgrounds.length;h++)if(e=0===h?1:0,!a.backgrounds[h].rect.intersects(f)){g.rect.origin.x>=a.backgrounds[e].rect.origin.x?a.backgrounds[h].rect.setLocation(new sugarLab.Vec2(a.backgrounds[e].rect.location.x+b.x,0)):a.backgrounds[h].rect.setLocation(new sugarLab.Vec2(a.backgrounds[e].rect.location.x-b.x,0));break}},a.draw=function(){d.drawImage({image:e,location:a.backgrounds[0].rect.location,drawOrigin:new sugarLab.Vec2(0,0)}),d.drawImage({image:e,location:a.backgrounds[1].rect.location,drawOrigin:new sugarLab.Vec2(0,0)})}}function Spawner(){var a,b,c=this;c.lastSpawn=5*SPAWN_INTERVAL,c.spawnsLeft=WAVE_SIZE,$(".modal").append(domjs.build(templates.spawnTimer)),b=$(".timer-wrapper"),a=$(".dial"),a.knob({max:10,width:100,inputColor:"#771100",fgColor:"#CC2200",bgColor:"#552211"}),c.update=function(){var d=app.currentScene.getEntitiesByTag("persian").length,e="regular";0===d?(a.val(c.lastSpawn.toFixed()).trigger("change"),b.show()):b.hide(),c.lastSpawn-=app.deltaTime,c.spawnsLeft>0?c.lastSpawn<=0&&(b.animate({height:"0"}),c.lastSpawn=SPAWN_INTERVAL,c.spawnsLeft--,app.currentScene.addEntity(new Persian(app.assetCollection.assets.persians[e]))):0===d&&(c.lastSpawn=sugarLab.Tween.lerp(5*SPAWN_INTERVAL,5,app.currentScene.time/18e4),a.trigger("configure",{max:c.lastSpawn.toFixed()}),c.spawnsLeft=WAVE_SIZE)},c.draw=function(){}}var TEXT_COLOR="#771100",ARMOR_THRESHOLD=6e4,ARMOR_CHANCE=.75,ARCHER_THRESHOLD=9e4,ARCHER_CHANCE=.9,ATTACK_INTERVAL=1,SPAWN_INTERVAL=2,WAVE_SIZE=5,CAMERA_OFFSET=new sugarLab.Vec2(400,300);!function(){window.AI={persian:function(){var a=this,b=app.currentScene.getEntitiesByTag("spartan")[0],c=a.facing>0?"-right":"-left";a.facing=b.rect.origin.x>=a.rect.origin.x?1:-1,a.timeToAttack-=app.deltaTime,a.health<=0?app.currentScene.removeEntity(a):("attack"===a.state&&a.timeToAttack>0||("attack"===a.state&&a.attack(),a.rect.origin.distance(b.rect.origin)<a.range?a.state="attack":(a.state="walk",a.rect.translate(a.moveSpeed.getScaled(a.facing).getScaled(app.deltaTime)))),a.animator.playAnimation(a.state+c),a.animator.update())},spartan:function(){var a,b=this,c=app.currentScene.getEntitiesByTag("persian"),d=c[0];if(b.timeToAttack-=app.deltaTime,b.health=5,"attack"===b.state&&b.timeToAttack>0);else{"attack"===b.state&&b.attack();for(var e=0;e<c.length;e++)c[e].rect.origin.distance(b.rect.origin)<=d.rect.origin.distance(b.rect.origin)&&(d=c[e]);d?(d.rect.origin.x>=b.rect.origin.x?b.facing=1:d.rect.origin.x<=b.rect.origin.x&&(b.facing=-1),b.state=d.rect.origin.distance(b.rect.origin)<=b.range?"attack":"walk"):b.state="idle"}"walk"===b.state&&b.rect.translate(b.moveSpeed.getScaled(b.facing).getScaled(app.deltaTime)),a=b.facing>0?"-right":"-left",a="idle"===b.state?"":a,b.animator.playAnimation(b.state+a),b.animator.update(),app.camera.offset=new sugarLab.Vec2(b.rect.origin.getScaled(-1).getTranslated(CAMERA_OFFSET).x,0)}}}();