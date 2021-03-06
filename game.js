SL = sugarLab;

var SCREEN_SIZE = new SL.Vec2(800, 600),
    CAMERA_OFFSET = new SL.Vec2(0, 0),
    BASE_ENGINE_SPEED = 50,
    CAMERA_SWITCH_TIME = 10,
    CAMERA_MOVE_SPEED = 50,
    CAMERA_OUTER_DISTANCE = 200,
    MOMENTUM_PER_TON = 10,
    MOMENTUM_DECAY_RATE = 200,
    MOMENTUM_POUND_DECAY_RATE = 50,
    MOMENTUM_SLUG_MINIMUM = 0.75,
    WEIGHT_DRAG_MODIFIER = 50,
    MAX_SPEED_WEIGHT_MODIFIER = 100;

function logPlay() {
    _gaq.push(['_trackEvent', 'Button', 'Play']);
}

function start() {
    var startLoad = new Date;

    window.app = new SL.Game({canvas: document.getElementById('GameCanvas')});
    app.camera = new SL.Camera(app.sctx, SCREEN_SIZE.getScaled(0.5));

    app.assetCollection = new SL.AssetCollection('res/assets.json', app, function () {
        _gaq.push(['_trackEvent', 'Game', 'Load', '', (new Date - startLoad) / 1000]);
        $('.canvas-container').append(domjs.build(templates.modal));

        var loadingScene = new SL.Scene('loading', [], function () {
        }, app);

        loadingScene.addEntity(new SL.Loader({
            assetCollection: app.assetCollection,
            screenSize: SCREEN_SIZE,
            loadCallback: function () { app.transitionScene('menu'); },
            barColor: 'blue',
            textColor: 'green'
        }));

        var menuScene = new SL.Scene('menu', [], function () {
            var modal = $('.modal');

            modal.append(domjs.build(templates.menu));

            $('.menu .button').on('click', function () {
                modal.empty();
                modal.off();
                app.transitionScene($(this).attr('id'));
            });
        }, app);

        var settingsScene = new SL.Scene('settings', [], function () {
            var modal = $('.modal');

            modal.append(domjs.build(templates.settings));

            $('.menu .button').on('click', function () {
                var idClicked = $(this).attr('id');

                if (idClicked === 'menu') {
                    modal.empty();
                    modal.off();
                    app.transitionScene(idClicked);
                } else {
                    //settings logic
                }
            });

            app.currentScene.addEntity({
                update: function () {},
                draw: function (sctx) { sctx.clearRect(0, 0, 800, 600); }
            });
        });

        var aboutScene = new SL.Scene('about', [], function () {
            var modal = $('.modal');

            modal.append(domjs.build(templates.about));

            $('.menu .button').on('click', function () {
                modal.empty();
                modal.off();
                app.transitionScene($(this).attr('id'));
            });

            app.currentScene.addEntity({
                update: function () {},
                draw: function (sctx) { sctx.clearRect(0, 0, 800, 600); }
            });
        });

        var gameScene = new SL.Scene('game', [], function () {
            var bg = app.assetCollection.getImage('bg-1');

            app.currentScene.addEntity({
                lastTeam: 50,
                timeToSwitch: CAMERA_SWITCH_TIME,
                currentShip: null,
                update: function () {
                    var ships = app.currentScene.getEntitiesByTag('SHIP'),
                        fighters = ships.filter(function (d) {
                            return (d.blueprint.name === 'fighter');
                        }),
                        corvettes = ships.filter(function (d) {
                            return (d.blueprint.name === 'corvette');
                        }),
                        cameraTarget;

                    this.timeToSwitch -= app.deltaTime;
                    if (this.timeToSwitch <= 0 || this.currentShip === null || this.currentShip.dead || this.currentShip.dead === null) {
                        this.timeToSwitch = CAMERA_SWITCH_TIME;
                        this.currentShip = ships[Math.floor(Math.random() * ships.length)];
                    }

                    cameraTarget = SCREEN_SIZE.getScaled(0.5).translate(this.currentShip.collider.origin.getScaled(-1));
                    app.camera.offset.translate(app.camera.offset.getDirectionVector(cameraTarget).getScaled(
                        SL.Tween.quadIn(CAMERA_MOVE_SPEED, app.camera.offset.distance(cameraTarget) / CAMERA_OUTER_DISTANCE)
                    ));

                    for (var i = fighters.length; i < 5; i++) {
                        createEasyFighter({
                            team: ++this.lastTeam,
                            location: new SL.Vec2(1000, 1000).randomize()
                        });
                    }
                    for (i = corvettes.length; i < 1; i++) {
                        createEasyCorvette({
                            team: ++this.lastTeam,
                            location: new SL.Vec2(1000, 1000).randomize()
                        });
                    }
                },
                draw: function () {
                    var drawLocation = new SL.Vec2(0, 0);

                    if (this.currentShip && this.currentShip.dead !== null) {
                        drawLocation = this.currentShip.collider.origin.clone();
                    }

                    app.camera.drawImage({
                        image: bg,
                        location: drawLocation
                    });
                },
                zIndex: 0
            });

            app.currentScene.addEntity({
                update: function () {},
                draw: function () {
                    app.camera.drawText({
                        text: 'FPS: ' + app.fps,
                        color: 'red',
                        location: app.camera.offset.getScaled(-1).translate(new SL.Vec2(5, 15))
                    })
                },
                zIndex: 5
            });
            test();
        }, app);

        app.addScene(loadingScene);
        app.addScene(menuScene);
        app.addScene(gameScene);
        app.addScene(settingsScene);
        app.addScene(aboutScene);
        app.transitionScene('loading');

        app.start();
    });
}

function Ship (config) {
    var me = this,
        newBlueprintConfig = app.assetCollection.assets.blueprints[config.blueprint];

    me.tag = 'SHIP';

    newBlueprintConfig.ship = me;

    me.blueprint = new Blueprint(newBlueprintConfig);

    me.dead = false;

    me.messageBus = {
        ENGINE: [],
        BLASTER: [],
        TURRET: [],
        MISSILE: [],
        ATTITUDE: [],
        TARGET: [],
        COLLISION: []
    };

    me.collider = new SL.Circle(config.location, me.blueprint.size);
    me.rotation = 90;

    me.totalEngineSpeed = 0;
    me.totalAttitudeSpeed = 0;

    me.velocity = new SL.Vec2(0, 0);
    me.angularVelocity = 0;

    me.momentum = 0;
    me.angularMomentum = 0;

    me.weight = me.blueprint.weight;

    me.integrity = 1;
    me.baseArmor = me.blueprint.baseArmor;
    me.armor = me.baseArmor;

    me.team = config.team || 0;

    me.target = null;

    me.zIndex = 1;

    me.update = function () {
        var speed;

        for (i = 0; i < me.messageBus.COLLISION.length; i++) {
            me.evaluateCollision(me.messageBus.COLLISION[i]);
            me.evaluateIntegrity();
        }

        for (i = 0; i < me.messageBus.TARGET.length; i++) {
            me.target = me.messageBus.TARGET[i];
        }

        for (var i in me.messageBus) {
            for (var i2 = 0; i2 < me.messageBus[i].length; i2++) {
                for (var i3 = 0; i3 < me.blueprint.slots.length; i3++) {
                    if (me.blueprint.slots[i3].module && i === me.blueprint.slots[i3].module.type) {
                        me.blueprint.slots[i3].module.message(me.messageBus[i][i2]);
                    }
                }
            }
            me.messageBus[i] = [];
        }

        me.blueprint.update();

        for (i = 0; i < me.blueprint.slots.length; i++) {
            if (me.blueprint.slots[i].module) {
                me.blueprint.slots[i].module.update();
            }
        }

        speed = SL.Tween.quadIn(me.totalEngineSpeed / (me.weight / MAX_SPEED_WEIGHT_MODIFIER), me.momentum / (me.weight * MOMENTUM_PER_TON));
        me.velocity = SL.Vec2.fromPolar(speed, me.rotation);
        me.collider.origin.translate(me.velocity.getScaled(app.deltaTime));

        me.angularVelocity = SL.Tween.quartOut(me.totalAttitudeSpeed / (me.weight / MAX_SPEED_WEIGHT_MODIFIER),
            Math.abs(me.angularMomentum) / (me.weight * MOMENTUM_PER_TON)) * SL.sign(me.angularMomentum);
        me.rotation += me.angularVelocity * app.deltaTime;

        me.rotation = SL.wrapAngle(me.rotation);

        me.momentum -= MOMENTUM_DECAY_RATE * app.deltaTime;
        me.momentum = SL.clamp(me.momentum, 0, (me.weight * MOMENTUM_PER_TON));

        me.angularMomentum = SL.decayToZero(me.angularMomentum, MOMENTUM_DECAY_RATE * (me.weight / WEIGHT_DRAG_MODIFIER) * app.deltaTime);
        me.angularMomentum = SL.clamp(me.angularMomentum, -(me.weight * MOMENTUM_PER_TON), (me.weight * MOMENTUM_PER_TON));

        if (me.dead) {
            app.currentScene.removeEntity(me);
        }
    };

    me.draw = function () {
        /**
        app.camera.drawCircle({
            origin: me.collider.origin,
            radius: me.collider.radius,
            lineColor: 'red',
            lineWidth: 2
        });
         **/

        me.blueprint.draw();

        for (var i = 0; i < me.blueprint.slots.length; i++) {
            if (me.blueprint.slots[i].module) {
                me.blueprint.slots[i].module.draw();
            }
        }

        /**
        app.camera.drawText({
            text: me.velocity.x.toFixed(2) + '  ' + me.velocity.y.toFixed(2),
            location: me.collider.origin.getTranslated(new SL.Vec2(0, 40)),
            align: 'center'
        });

        app.camera.drawText({
            text: me.angularVelocity.toFixed(2),
            location: me.collider.origin.getTranslated(new SL.Vec2(0, 55)),
            align: 'center'
        });
        app.camera.drawText({
            text: me.entityID,
            location: me.collider.origin.getTranslated(new SL.Vec2(0, 40)),
            align: 'center'
        });
        app.camera.drawText({
            text: me.team,
            location: me.collider.origin.getTranslated(new SL.Vec2(0, 60)),
            align: 'center'
        });
        app.camera.drawText({
            text: me.target ? me.target.entityID : '',
            location: me.collider.origin.getTranslated(new SL.Vec2(0, -40)),
            align: 'center'
        });
        app.camera.drawText({
            text: me.target ? me.target.team : '',
            location: me.collider.origin.getTranslated(new SL.Vec2(0, -60)),
            align: 'center'
        });
         **/
    };

    me.message = function(type, message) {
        me.messageBus[type].push(message);
    };

    me.setSlotModule = function (slot, module) {
        if (slot.isModuleCompatible(module)) {
            if (slot.module) {
                slot.module.removeFromShip();
            }

            module.addToShip(me, slot);

            if (me.weight > me.blueprint.maxWeight) {
                slot.module.removeFromShip();
            }
        }
    };

    me.setModuleProjectile = function (module, projectile) {
        if (module.isProjectileCompatible(projectile)) {
            module.projectile = projectile;
        }
    };

    me.impulse = function (impulse) {
        me.momentum += impulse * app.deltaTime;
    };

    me.angularImpulse = function (impulse) {
        me.angularMomentum += impulse * app.deltaTime;
    };

    me.evaluateCollision = function (collision) {
        var actualDamage = SL.Tween.quadIn(collision.damage, collision.penetration / me.armor);

        me.integrity -= actualDamage / me.weight;
    };

    me.evaluateIntegrity = function () {
        var deathChance = SL.Tween.quadInOut(1, me.integrity);

        if (Math.random() >= deathChance) {
            me.dead = true;
        }
    };
}

function Blueprint (config) {
    var me = this,
        slots;

    for (var i in config) {
        me[i] = config[i];
    }

    slots = me.slots;
    me.slots = [];
    for (i = 0; i < slots.length; i++) {
        me.slots.push(new Slot(slots[i]));
        me.slots[i].blueprint = me;
    }

    me.image = app.assetCollection.getImage(me.name + '-hull.png');

    me.update = function () {

    };
}

function Slot (config) {
    var me = this;

    for (var i in config) {
        me[i] = config[i];
    }

    me.location = new SL.Vec2(me.location.x, me.location.y); //location of slot in relation to center of blueprint, in blueprint space

    me.module = null; //module that currently occupies the slot

    me.isModuleCompatible = function (module) {
        return (me.type === 'DYNAMIC' || me.type === module.type);
    };
}

function Module (config) {
    var me = this;

    var buildModule = function () {
        me.BLASTER = function () {
            me.timeToFire = 0;
            me.currentClip = me.clip;
            me.state = 'IDLE';

            me.update = function () {
                for (var i = 0; i < me.messages.length; i++) {
                    if (me.messages[i] === 'FIRE') {
                        if (me.state === 'IDLE') {
                            me.state = 'FIRING';
                        }
                    }
                }
                me.messages = [];

                if (me.state !== 'IDLE') {
                    if (me.state === 'RELOAD') {
                        me.timeToFire -= app.deltaTime;
                        if (me.timeToFire <= 0) {
                            me.timeToFire = 0;
                            me.currentClip = me.clip;
                            me.state = 'IDLE';
                        }
                    }

                    if (me.state === 'FIRING' && me.currentClip > 0) {
                        if (me.timeToFire > 0) {
                            me.timeToFire -= app.deltaTime;
                        } else {
                            me.currentClip--;
                            me.timeToFire = me.fireInterval;
                            me.fire();

                            if (me.currentClip < 1) {
                                me.state = 'RELOAD';
                                me.timeToFire = me.reloadTime;
                            }
                        }
                    }
                }
            };

            me.fire = function () {
                var projectile = new Projectile(me.projectile);

                projectile.collider = new SL.Circle(me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation), projectile.size);
                projectile.angle = me.ship.rotation;
                projectile.velocity = SL.Vec2.fromPolar(1, projectile.angle).scale(me.power / (projectile.weight / 2)).translate(me.ship.velocity);
                projectile.team = me.ship.team;

                app.currentScene.addEntity(projectile);
            };
        };

        me.MISSILE = function () {
            me.timeToFire = 0;
            me.currentClip = me.clip;
            me.state = 'IDLE';

            me.update = function () {
                for (var i = 0; i < me.messages.length; i++) {
                    if (me.messages[i] === 'FIRE') {
                        if (me.state === 'IDLE') {
                            me.state = 'FIRING';
                        }
                    }
                }
                me.messages = [];

                if (me.state !== 'IDLE') {
                    if (me.state === 'RELOAD') {
                        me.timeToFire -= app.deltaTime;
                        if (me.timeToFire <= 0) {
                            me.timeToFire = 0;
                            me.currentClip = me.clip;
                            me.state = 'IDLE';
                        }
                    }

                    if (me.state === 'FIRING' && me.currentClip > 0) {
                        if (me.timeToFire > 0) {
                            me.timeToFire -= app.deltaTime;
                        } else {
                            me.currentClip--;
                            me.timeToFire = me.fireInterval;
                            me.fire();

                            if (me.currentClip < 1) {
                                me.state = 'RELOAD';
                                me.timeToFire = me.reloadTime;
                            }
                        }
                    }
                }
            };

            me.fire = function () {
                var projectile = new Projectile(me.projectile);

                projectile.collider = new SL.Circle(me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation), projectile.size);
                projectile.angle = me.ship.rotation;
                projectile.team = me.ship.team;

                projectile.target = me.ship.target;

                app.currentScene.addEntity(projectile);
            };
        };

        me.ENGINE = function () {
            me.state = 'IDLE';

            me.update = function () {
                for (var i = 0; i < me.messages.length; i++) {
                    if (me.messages[i] === 'TOGGLE') {
                        if (me.state === 'IDLE') {
                            me.state = 'IMPULSE';
                        } else {
                            me.state = 'IDLE'
                        }
                    } else if (me.messages[i] === 'IDLE' || me.messages[i] === 'IMPULSE') {
                        me.state = me.messages[i];
                    }
                }
                me.messages = [];

                if (me.state === 'IMPULSE') {
                    me.ship.impulse(me.impulse);
                }
            };
        };

        me.UTILITY = function () {
            me.update = function () {

            };
        };

        me.ARMOR = function () {
            me.update = function () {};

            me.draw = function () {};
        };

        me.ATTITUDE = function () {
            me.state = 0;

            me.update = function () {
                for (var i = 0; i < me.messages.length; i++) {
                    me.state = parseInt(me.messages[i]);
                }
                me.messages = [];

                if (me.state !== 0) {
                    if (me.state === 1) {
                        me.ship.angularImpulse(me.impulse);
                    } else {
                        me.ship.angularImpulse(-me.impulse);
                    }
                }
            };
        };

        me.isProjectileCompatible = function (projectile) {
            return (me.projectileType === projectile.type);
        };

        me[me.type]();
    };

    for (var i in config) {
        me[i] = config[i];
    }

    me.addToShip = function (ship, slot) {
        me.ship = ship;
        me.slot = slot;
        me.slot.module = me;
        me.ship.weight += me.weight;

        me.armor ? me.ship.armor += me.armor : null;

        if (me.speed) {
            me.type === 'ENGINE' ? me.ship.totalEngineSpeed += me.speed : me.ship.totalAttitudeSpeed += me.speed;
        }
        me.sprite.anchor.x = 0.5;
        me.sprite.anchor.y = 0.5;
        me.sprite.position.x = me.slot.location.x;
        me.sprite.position.y = me.slot.location.y;
    };

    me.removeFromShip = function () {
        if (me.speed) {
            me.type === 'ENGINE' ? me.ship.totalEngineSpeed -= me.speed : me.ship.totalAttitudeSpeed -= me.speed;
        }

        me.armor ? me.ship.armor -= me.armor : null;

        me.ship.weight -= me.weight;

        me.ship = null;
        me.slot.module = null;
    };

    me.image = app.assetCollection.getImage(me.name);
    me.sprite = new PIXI.Sprite(app.assetCollection.getTexture(me.name));

    me.messages = [];

    me.message = function (message) {
        me.messages.push(message);
    };

    buildModule();
}

function Projectile (config) {
    var me = this;

    for (var i in config) {
        me[i] = config[i];
    }

    me.zIndex = 2;

    //do this in the module fire() method
    //me.collider = new SL.Circle(me.location, me.size);

    me.image = app.assetCollection.getImage('img/projectiles/' + me.name);

    var buildProjectile = function () {
        me.SLUG = function () {
            me.maxMomentum = me.weight * MOMENTUM_PER_TON;
            me.momentum = me.maxMomentum;

            me.update = function () {
                var ships = app.currentScene.getEntitiesByTag('SHIP'),
                    momentumModifier;

                me.momentum -= app.deltaTime * MOMENTUM_POUND_DECAY_RATE;
                momentumModifier = SL.Tween.quartOut(1, me.momentum / me.maxMomentum);

                if (momentumModifier > MOMENTUM_SLUG_MINIMUM) {
                    me.collider.origin.translate(me.velocity.getScaled(app.deltaTime));

                    for (var i = 0; i < ships.length; i++) {
                        if (ships[i].team !== me.team && me.collider.intersects(ships[i].collider)) {
                            ships[i].message('COLLISION', {
                                damage: me.damage,
                                penetration: me.penetration
                            });

                            app.currentScene.removeEntity(me);
                            break;
                        }
                    }
                } else {
                    app.currentScene.removeEntity(me);
                }
            };
        };

        me.MISSILE = function () {
            me.momentum = 0;

            me.update = function () {
                if (me.target.dead !== null && !me.target.dead) {
                    var ships = app.currentScene.getEntitiesByTag('SHIP'),
                        targetAngle = me.target.collider.origin.angleBetween(me.collider.origin),
                        rotationAmount = me.rotationSpeed * SL.rotateLeftRight(me.angle, targetAngle) * app.deltaTime;

                    me.momentum < 1 ? me.momentum += app.deltaTime : null;

                    if (Math.abs(rotationAmount) <= SL.rotationDistance(me.angle, targetAngle)) {
                        me.angle += rotationAmount;
                        me.angle = SL.wrapAngle(me.angle);
                    } else {
                        me.angle = targetAngle;
                    }

                    me.collider.origin.translateAlongRotation(SL.Tween.quadIn(me.speed, me.momentum) * app.deltaTime, me.angle);

                    for (var i = 0; i < ships.length; i++) {
                        if (ships[i].team !== me.team && me.collider.intersects(ships[i].collider)) {
                            ships[i].message('COLLISION', {
                                damage: me.damage,
                                penetration: me.penetration
                            });

                            app.currentScene.removeEntity(me);
                            break;
                        }
                    }
                } else {
                    app.currentScene.removeEntity(me);
                }
            };
        };

        me[me.type]();
    };

    buildProjectile();
}

function AI (config) {
    var me = this;

    me.ship = config.ship;
    me.team = config.team;
    me.type = config.type;

    me.target = null;

    me.disabled = false;

    me.update = config.update ? config.update.bind(me) : me.update;
    me.draw = config.draw ? config.draw.bind(me) : me.draw;

    app.currentScene.addEntity(me);
}

AI.prototype.update = function () {
    var me = this,
        ships = app.currentScene.getEntitiesByTag('SHIP');


    if (me.ship.dead === undefined || me.ship.dead === null || me.ship.dead) {
        me.disabled = true;
    } else  {
        ships = ships.filter(function (d) {
            return !(d.team === me.team || d.dead);
        });

        if (!me.target || me.target.dead === undefined || me.target.dead === null) {
            me.target = ships[Math.floor(Math.random() * ships.length)];
        }
        if (me.target) {
            me.ship.message('TARGET', me.target);
        }
    }
};

AI.prototype.lateUpdate = function () {
    var me = this;

    if (me.disabled || me.ship.dead === undefined || me.ship.dead === null || me.ship.dead) {
        app.currentScene.removeEntity(me);
    }
}
;
function EasyAI() {
    var me = this,
        firingRotationDeviance = 10,
        stoppingDistance = 300,
        targetRotation;

    AI.prototype.update.call(me);

    if (!me.disabled && me.target) {
        targetRotation = SL.wrapAngle(me.ship.collider.origin.angleBetween(me.target.collider.origin) + 180);

        me.ship.message('ATTITUDE', SL.rotateLeftRight(me.ship.rotation, targetRotation));
        if (me.ship.collider.origin.distance(me.target.collider) <= stoppingDistance) {
            me.ship.message('ENGINE', 'IDLE');
        } else {
            me.ship.message('ENGINE', 'IMPULSE');
        }

        if (Math.abs(targetRotation - me.ship.rotation) <= firingRotationDeviance) {
            me.ship.message('BLASTER', 'FIRE');
        }
        me.ship.message('MISSILE', 'FIRE');
    }

    AI.prototype.lateUpdate.call(me);
}

function createEasyFighter (config) {
    var newShip = new Ship({
        blueprint: 'fighter',
        location: config.location,
        team: config.team
    });

    if (Math.random() >= 0.5) {
        newShip.setSlotModule(newShip.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
        newShip.setModuleProjectile(newShip.blueprint.slots[0].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
        newShip.setSlotModule(newShip.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
        newShip.setSlotModule(newShip.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
        newShip.setSlotModule(newShip.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    } else {
        newShip.setSlotModule(newShip.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['MISSILE']['fighter']));
        newShip.setModuleProjectile(newShip.blueprint.slots[0].module, new Projectile(app.assetCollection.assets['projectiles']['MISSILE'][(Math.random() >= 0.5 ? 'heat' : 'flak')]));
        newShip.setSlotModule(newShip.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
        newShip.setSlotModule(newShip.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
        newShip.setSlotModule(newShip.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    }

    app.currentScene.addEntity(newShip);

    new AI({
        ship: newShip,
        team: config.team,
        type: 'EASY',
        update: EasyAI
    });
}

function createEasyCorvette (config) {
    var newShip = new Ship({
        blueprint: 'corvette',
        location: config.location,
        team: config.team
    });

    newShip.setSlotModule(newShip.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['ENGINE']['corvette']));
    newShip.setSlotModule(newShip.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['corvette']));
    newShip.setSlotModule(newShip.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ENGINE']['corvette']));
    newShip.setSlotModule(newShip.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ENGINE']['corvette']));
    newShip.setSlotModule(newShip.blueprint.slots[4], new Module(app.assetCollection.assets['modules']['ENGINE']['corvette']));
    newShip.setSlotModule(newShip.blueprint.slots[5], new Module(app.assetCollection.assets['modules']['MISSILE']['fighter']));
    newShip.setModuleProjectile(newShip.blueprint.slots[5].module, new Projectile(app.assetCollection.assets['projectiles']['MISSILE'][(Math.random() >= 0.5 ? 'heat' : 'flak')]));
    newShip.setSlotModule(newShip.blueprint.slots[6], new Module(app.assetCollection.assets['modules']['MISSILE']['fighter']));
    newShip.setModuleProjectile(newShip.blueprint.slots[6].module, new Projectile(app.assetCollection.assets['projectiles']['MISSILE'][(Math.random() >= 0.5 ? 'heat' : 'flak')]));
    newShip.setSlotModule(newShip.blueprint.slots[7], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    newShip.setModuleProjectile(newShip.blueprint.slots[7].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
    newShip.setSlotModule(newShip.blueprint.slots[8], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    newShip.setModuleProjectile(newShip.blueprint.slots[8].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
    newShip.setSlotModule(newShip.blueprint.slots[9], new Module(app.assetCollection.assets['modules']['ATTITUDE']['corvette']));
    newShip.setSlotModule(newShip.blueprint.slots[10], new Module(app.assetCollection.assets['modules']['ATTITUDE']['corvette']));

    app.currentScene.addEntity(newShip);

    new AI({
        ship: newShip,
        team: config.team,
        type: 'EASY',
        update: EasyAI
    });
}

function test () {
    var testRange = new SL.Vec2(1000, 1000);

    for (var i = 0; i < 5; i++) {
        createEasyFighter({
            team: i,
            location: testRange.clone().randomize()
        });
    }

    for (i = 0; i < 1; i++) {
        createEasyCorvette({
            team: i,
            location: testRange.clone().randomize()
        });
    }
}