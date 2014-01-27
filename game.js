SL = sugarLab;

var CAMERA_OFFSET = new SL.Vec2(0, 0);

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
            textLocation: new SL.Vec2(400, 300),
            update: function () {
                if (app.assetCollection.getLoadedPercentage() === 100) {
                    app.transitionScene('menu');
                }
            },
            draw: function (sctx) {
                sctx.clearRect(0, 0, 800, 600);
                app.camera.drawText({
                    location: app.screenSize.getScaled(0.5),
                    align: 'center',
                    text: app.assetCollection.getLoadedPercentage().toFixed() + '%',
                    color: TEXT_COLOR,
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

    newBlueprintConfig.ship = me;

    me.blueprint = new Blueprint(newBlueprintConfig);
    me.messageQueue = []; //queue of messages to be distributed to slots

    me.collider = new SL.Circle(config.location, me.blueprint.size);
    me.rotation = 0;

    me.weight = me.blueprint.weight;

    me.update = function () {
        me.blueprint.update();

        for (var i = 0; i < me.blueprint.slots.length; i++) {
            if (me.blueprint.slots[i].module) {
                me.blueprint.slots[i].module.update();
            }
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
    };

    me.setSlotModule = function (slot, module) {
        if (slot.isModuleCompatible(module)) {
            if (slot.module) {
                if (me.weight - slot.module.weight + module.weight <= me.blueprint.maxWeight) {
                    me.weight = me.weight - slot.module.weight + module.weight;
                    slot.module = module;
                    slot.module.ship = me;
                    slot.module.slot = slot;
                }
            } else {
                if (me.weight + module.weight <= me.blueprint.maxWeight) {
                    me.weight = me.weight + module.weight;
                    slot.module = module;
                    slot.module.ship = me;
                    slot.module.slot = slot;
                }
            }
        }
    }
}

function Blueprint (config) {
    var me = this;

    for (var i in config) {
        me[i] = config[i];
    }

    for (i = 0; i < me.slots.length; i++) {
        var newConfig = me.slots[i];

        newConfig.blueprint = me;
        me.slots[i] = new Slot(newConfig);
    }

    me.image = app.assetCollection.getImage(me.name + '-hull.png');

    me.update = function () {

    };

    me.draw = function () {
        app.camera.drawImage({
            image: me.image,
            location: me.ship.collider.origin
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
            me.update = function () {

            };

            me.draw = function () {
                app.camera.drawText({
                    location: me.ship.collider.origin.getTranslated(me.slot.location),
                    align: 'center',
                    text: 'B'
                });
            };
        };

        me.ENGINE = function () {
            me.update = function () {

            };

            me.draw = function () {
                app.camera.drawText({
                    location: me.ship.collider.origin.getTranslated(me.slot.location),
                    align: 'center',
                    text: 'E'
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
            me.update = function () {

            };

            me.draw = function () {
                app.camera.drawText({
                    location: me.ship.collider.origin.getTranslated(me.slot.location),
                    align: 'center',
                    text: 'A'
                });
            };
        };

        me[me.type]();
    };

    for (var i in config) {
        me[i] = config[i];
    }

    buildModule(me);
}

function test () {
    var testShip = new Ship({
        blueprint: 'fighter',
        location: new SL.Vec2(0, 0)
    });

    testShip.setSlotModule(testShip.blueprint.slots[0], new Module(app.assetCollection.assets['modules']['BLASTER']['fighter']));
    testShip.setSlotModule(testShip.blueprint.slots[1], new Module(app.assetCollection.assets['modules']['ENGINE']['fighter']));
    testShip.setSlotModule(testShip.blueprint.slots[2], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));
    testShip.setSlotModule(testShip.blueprint.slots[3], new Module(app.assetCollection.assets['modules']['ATTITUDE']['fighter']));

    app.currentScene.addEntity(testShip);
}