SL = sugarLab;

var CAMERA_OFFSET = new SL.Vec2(0, 0),
    BASE_ENGINE_SPEED = 50,
    MOMENTUM_PER_TON = 10,
    MOMENTUM_DECAY_RATE = 200,
    ANGULAR_DRAG_MODIFIER = 10;

function logPlay() {
    _gaq.push(['_trackEvent', 'Button', 'Play']);
}

function start() {
    var startLoad = new Date;

    window.app = new SL.Game({canvas: document.getElementById('GameCanvas')});
    app.camera = new SL.Camera(app.sctx, new SL.Vec2(400, 300));

    app.assetCollection = new SL.AssetCollection('res/assets.json', app, function () {
        _gaq.push(['_trackEvent', 'Game', 'Load', '', (new Date - startLoad) / 1000]);
        $('.canvas-container').append(domjs.build(templates.modal));

        var loadingScene = new SL.Scene('loading', [], function () {
        });
        loadingScene.addEntity({
            percentLoaded: 0,
            textLocation: new SL.Vec2(0, 0),
            update: function () {
                if (app.assetCollection.getLoadedPercentage() === 100) {
                    app.transitionScene('menu');
                }
            },
            draw: function (sctx) {
                sctx.clearRect(0, 0, 800, 600);
                app.camera.drawText({
                    location: this.textLocation,
                    align: 'center',
                    text: app.assetCollection.getLoadedPercentage().toFixed() + '%',
                    color: 'green',
                    font: '72px Arial'
                });
            }
        });

        var menuScene = new SL.Scene('menu', [], function () {
            var modal = $('.modal');

            modal.append(domjs.build(templates.menu));

            $('.menu .button').on('click', function () {
                modal.empty();
                modal.off();
                app.transitionScene($(this).attr('id'));
            });
        });

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
                update: function () {
                    if (app.currentScene.getEntitiesByTag('SHIP')[2]) {
                        app.camera.offset = new SL.Vec2(400, 300).translate(app.currentScene.getEntitiesByTag('SHIP')[2].collider.origin.getScaled(-1));
                    }
                },
                draw: function () {
                    var drawLocation = new SL.Vec2(0, 0);

                    if (app.currentScene.getEntitiesByTag('SHIP')[2]) {
                        drawLocation = app.currentScene.getEntitiesByTag('SHIP')[2].collider.origin.clone();
                    }

                    app.camera.drawImage({
                        image: bg,
                        location: drawLocation
                    });
                }
            });
            test();
        });

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

    /*
    Messages will follow the below format
    {
        sendTo: [           //For ENGINE modules
            "ENGINE"
        ],
        message: 'TOGGLE'

        /////////////////////

        sendTo: [
            "BLASTER"
        ],
        message: 'FIRE'

        /////////////////////

        sendTo: [
            "ATTITUDE"
        ],
        message: 0 || 1     //CLOCKWISE or COUNTER-CLOCKWISE

        /////////////////////

        sendTo: [
            "SHIELD"
        ],
        message: 'TOGGLE'

        /////////////////////
    }
    */
    me.messageBus = {
        ENGINE: [],
        BLASTER: [],
        TURRET: [],
        MISSILE: [],
        ATTITUDE: [],
        TARGET: []
    };

    me.collider = new SL.Circle(config.location, me.blueprint.size);
    me.rotation = 90;

    me.velocity = new SL.Vec2(0, 0);
    me.angularVelocity = 0;

    me.momentum = 0;

    me.weight = me.blueprint.weight;

    me.maxSpeed = 0;

    me.team = 0;

    me.zIndex = 1;

    me.update = function () {
        var speed;

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

        speed = SL.Tween.quadIn(me.maxSpeed, me.momentum / (me.weight * MOMENTUM_PER_TON));
        me.velocity = SL.Vec2.fromPolar(speed, me.rotation);
        me.collider.origin.translate(me.velocity.getScaled(app.deltaTime));

        me.angularVelocity += (-me.angularVelocity / ANGULAR_DRAG_MODIFIER) * (me.weight / 100);
        me.rotation += me.angularVelocity * app.deltaTime;

        if (me.rotation < 0) {
            me.rotation = 360 - me.rotation;
        } else if (me.rotation > 360) {
            me.rotation = me.rotation - 360;
        }

        me.momentum -= MOMENTUM_DECAY_RATE * app.deltaTime;
        me.momentum = SL.clamp(me.momentum, 0, (me.weight * MOMENTUM_PER_TON));
    };

    me.draw = function () {
        app.camera.drawCircle({
            origin: me.collider.origin,
            radius: me.collider.radius,
            lineColor: 'red',
            lineWidth: 2
        });

        me.blueprint.draw();

        for (var i = 0; i < me.blueprint.slots.length; i++) {
            if (me.blueprint.slots[i].module) {
                me.blueprint.slots[i].module.draw();
            }
        }

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
    };

    me.message = function(type, message) {
        me.messageBus[type].push(message);
    };

    me.setSlotModule = function (slot, module) {
        if (slot.isModuleCompatible(module)) {
            if (slot.module) {
                if (me.weight - slot.module.weight + module.weight <= me.blueprint.maxWeight) {
                    me.weight = me.weight - slot.module.weight + module.weight;
                    slot.module = module;
                    slot.module.ship = me;
                    slot.module.slot = slot;
                    me.evaluateMaxSpeed();
                }
            } else {
                if (me.weight + module.weight <= me.blueprint.maxWeight) {
                    me.weight = me.weight + module.weight;
                    slot.module = module;
                    slot.module.ship = me;
                    slot.module.slot = slot;
                    me.evaluateMaxSpeed();
                }
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
        me.angularVelocity += impulse * (1 / me.weight);
    };

    me.evaluateMaxSpeed = function () {
        for (var i = 0; i < me.blueprint.slots.length; i++) {
            if (me.blueprint.slots[i].type === 'ENGINE' && me.blueprint.slots[i].module) {
                me.maxSpeed += me.blueprint.slots[i].module.speed;
            }
        }
        me.maxSpeed /= (me.weight / 100);
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

    me.draw = function () {
        app.camera.drawImage({
            image: me.image,
            location: me.ship.collider.origin,
            angle: me.ship.rotation
        });
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

            me.draw = function () {
                app.camera.drawImage({
                    image: me.image,
                    location: me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation),
                    angle: me.ship.rotation
                });
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

            me.draw = function () {
                app.camera.drawImage({
                    image: me.image,
                    location: me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation),
                    angle: me.ship.rotation
                });
            };

            me.fire = function () {
                var projectile = new Projectile(me.projectile);

                projectile.collider = new SL.Circle(me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation), projectile.size);
                projectile.angle = me.ship.rotation;
                projectile.team = me.ship.team;

                //TODO: switch to real target once target logic is complete
                projectile.target = app.currentScene.getEntitiesByTag('SHIP')[0];

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
                    }
                }
                me.messages = [];

                if (me.state === 'IMPULSE') {
                    me.ship.impulse(me.impulse);
                }
            };

            me.draw = function () {
                app.camera.drawImage({
                    image: me.image,
                    location: me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation),
                    angle: me.ship.rotation
                });
            };
        };

        me.UTILITY = function () {
            me.update = function () {

            };

            me.draw = function () {

            };
        };

        me.ATTITUDE = function () {
            me.state = 0;

            me.update = function () {
                for (var i = 0; i < me.messages.length; i++) {
                    me.state = parseInt(me.messages[i]);
                }
                me.messages = [];

                if (me.state > 0) {
                    if (me.state === 1) {
                        me.ship.angularImpulse(me.impulse);
                    } else {
                        me.ship.angularImpulse(-me.impulse);
                    }
                }
            };

            me.draw = function () {
                app.camera.drawCircle({
                    origin: me.ship.collider.origin.getTranslated(me.slot.location).rotate(me.ship.collider.origin, me.ship.rotation),
                    radius: 3,
                    lineColor: 'green'
                })
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

    me.image = app.assetCollection.getImage(me.name);

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
            me.update = function () {
                var ships = app.currentScene.getEntitiesByTag('SHIP');

                me.collider.origin.translate(me.velocity.getScaled(app.deltaTime));

                for (var i = 0; i < ships.length; i++) {
                    if (ships[i].team !== me.team && me.collider.intersects(ships[i].collider)) {
                        //TODO: Collision logic
                        app.currentScene.removeEntity(me);
                        break;
                    }
                }
            };

            me.draw = function () {
                app.camera.drawImage({
                    image: me.image,
                    location: me.collider.origin,
                    angle: me.angle
                });
            };
        };

        me.MISSILE = function () {
            me.update = function () {
                var ships = app.currentScene.getEntitiesByTag('SHIP'),
                    targetAngle = me.target.collider.origin.angleBetween(me.collider.origin);

                if (targetAngle < 0) {
                    targetAngle += 360;
                }

                me.angle = SL.Tween.lerp(0, targetAngle, (me.angle + me.rotationSpeed * app.deltaTime) / Math.abs(targetAngle - me.angle));

                me.collider.origin.translateAlongRotation(me.speed * app.deltaTime, me.angle);

                for (var i = 0; i < ships.length; i++) {
                    if (ships[i].team !== me.team && me.collider.intersects(ships[i].collider)) {
                        //TODO: Collision logic
                        app.currentScene.removeEntity(me);
                        break;
                    }
                }
            };

            me.draw = function () {
                app.camera.drawImage({
                    image: me.image,
                    location: me.collider.origin,
                    angle: me.angle
                });
            };
        };

        me[me.type]();
    };

    buildProjectile();
}

function test () {
    var testShip = new Ship({
        blueprint: 'fighter',
        location: new SL.Vec2(0, 0)
    });

    var testShip2 = new Ship({
        blueprint: 'fighter',
        location: new SL.Vec2(100, 0)
    });

    var testShip3 = new Ship({
        blueprint: 'corvette',
        location: new SL.Vec2(0, 200)
    });

    testShip.testID = 0;
    testShip2.testID = 1;

    testShip2.team = 1;
    testShip3.team = 2;

    testShip.setSlotModule(testShip.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    testShip.setModuleProjectile(testShip.blueprint.slots[0].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
    testShip.setSlotModule(testShip.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip.setSlotModule(testShip.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    testShip.setSlotModule(testShip.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));

    testShip2.setSlotModule(testShip2.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['MISSILE']['fighter']));
    testShip2.setModuleProjectile(testShip2.blueprint.slots[0].module, new Projectile(app.assetCollection.assets['projectiles']['MISSILE']['heat']));
    testShip2.setSlotModule(testShip2.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip2.setSlotModule(testShip2.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    testShip2.setSlotModule(testShip2.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));

    testShip3.setSlotModule(testShip3.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip3.setSlotModule(testShip3.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip3.setSlotModule(testShip3.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip3.setSlotModule(testShip3.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip3.setSlotModule(testShip3.blueprint.slots[4], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip3.setSlotModule(testShip3.blueprint.slots[5], new Module(app.assetCollection.assets['modules']['MISSILE']['fighter']));
    testShip3.setModuleProjectile(testShip3.blueprint.slots[5].module, new Projectile(app.assetCollection.assets['projectiles']['MISSILE']['heat']));
    testShip3.setSlotModule(testShip3.blueprint.slots[6], new Module(app.assetCollection.assets['modules']['MISSILE']['fighter']));
    testShip3.setModuleProjectile(testShip3.blueprint.slots[6].module, new Projectile(app.assetCollection.assets['projectiles']['MISSILE']['heat']));
    testShip3.setSlotModule(testShip3.blueprint.slots[7], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    testShip3.setModuleProjectile(testShip3.blueprint.slots[7].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
    testShip3.setSlotModule(testShip3.blueprint.slots[8], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    testShip3.setModuleProjectile(testShip3.blueprint.slots[8].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
    testShip3.setSlotModule(testShip3.blueprint.slots[9], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    testShip3.setSlotModule(testShip3.blueprint.slots[10], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));

    app.currentScene.addEntity(testShip);
    app.currentScene.addEntity(testShip2);
    app.currentScene.addEntity(testShip3);
}