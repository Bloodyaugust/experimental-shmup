SL = sugarLab;

var SCREEN_SIZE = new SL.Vec2(800, 600),
    CAMERA_OFFSET = new SL.Vec2(0, 0),
    BASE_ENGINE_SPEED = 50,
    MOMENTUM_PER_TON = 10,
    MOMENTUM_DECAY_RATE = 200,
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
                sctx.clearRect(0, 0, SCREEN_SIZE.x, SCREEN_SIZE.y);
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
                    if (app.currentScene.getEntitiesByTag('SHIP')[0]) {
                        app.camera.offset = SCREEN_SIZE.getScaled(0.5).translate(app.currentScene.getEntitiesByTag('SHIP')[0].collider.origin.getScaled(-1));
                    }
                },
                draw: function () {
                    var drawLocation = new SL.Vec2(0, 0);

                    if (app.currentScene.getEntitiesByTag('SHIP')[0]) {
                        drawLocation = app.currentScene.getEntitiesByTag('SHIP')[0].collider.origin.clone();
                    }

                    app.camera.drawImage({
                        image: bg,
                        location: drawLocation
                    });
                }
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

        me.angularVelocity = SL.Tween.quadIn(me.totalAttitudeSpeed / (me.weight / MAX_SPEED_WEIGHT_MODIFIER),
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
                    } else if (me.messages[i] === 'IDLE' || me.messages[i] === 'IMPULSE') {
                        me.state = me.messages[i];
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

    me.addToShip = function (ship, slot) {
        me.ship = ship;
        me.slot = slot;
        me.slot.module = me;
        me.ship.weight += me.weight;

        me.armor ? me.ship.armor += me.armor : null;

        if (me.speed) {
            me.type === 'ENGINE' ? me.ship.totalEngineSpeed += me.speed : me.ship.totalAttitudeSpeed += me.speed;
        }
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
                        ships[i].message('COLLISION', {
                            damage: me.damage,
                            penetration: me.penetration
                        });

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
            me.momentum = 0;

            me.update = function () {
                if (me.target.dead !== null && !me.target.dead) {
                    var ships = app.currentScene.getEntitiesByTag('SHIP'),
                        targetAngle = me.target.collider.origin.angleBetween(me.collider.origin);

                    me.momentum < 1 ? me.momentum += app.deltaTime : null;

                    me.angle += me.rotationSpeed * SL.rotateLeftRight(me.angle, targetAngle) * app.deltaTime;
                    me.angle = SL.wrapAngle(me.angle);

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
        ships.map(function (d, i, a) {
            if (d.team === me.team || d.dead) {
                a.slice(i, 1);
            }
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
};

AI.prototype.draw = function () {};

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

    newShip.setSlotModule(newShip.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    newShip.setModuleProjectile(newShip.blueprint.slots[0].module, new Projectile(app.assetCollection.assets['projectiles']['SLUG']['uranium']));
    newShip.setSlotModule(newShip.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    newShip.setSlotModule(newShip.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    newShip.setSlotModule(newShip.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));

    app.currentScene.addEntity(newShip);

    new AI({
        ship: newShip,
        team: config.team,
        type: 'EASY',
        update: EasyAI
    });
}

function test () {
    var testRange = new SL.Vec2(100, 100);

    for (var i = 0; i < 2; i++) {
        createEasyFighter({
            team: Math.floor(Math.random() * 999999),
            location: testRange.randomize()
        });
    }
}