var TEXT_COLOR = '#771100',
    ARMOR_THRESHOLD = 60000,
    ARMOR_CHANCE = 0.75,
    ARCHER_THRESHOLD = 90000,
    ARCHER_CHANCE = 0.9,
    ATTACK_INTERVAL = 1,
    SPAWN_INTERVAL = 2,
    WAVE_SIZE = 5,
    CAMERA_OFFSET = new sugarLab.Vec2(400, 300);

function logPlay() {
    _gaq.push(['_trackEvent', 'Button', 'Play']);
}

function start() {
    var startLoad = new Date;

    window.app = new sugarLab.Game({canvas: document.getElementById('GameCanvas')});
    app.camera = new sugarLab.Camera(app.sctx, new sugarLab.Vec2(0, 0));

    app.assetCollection = new sugarLab.AssetCollection('res/assets.json', app, function () {
        _gaq.push(['_trackEvent', 'Game', 'Load', '', (new Date - startLoad) / 1000]);
        $('.canvas-container').append(domjs.build(templates.modal));

        var loadingScene = new sugarLab.Scene('loading', [], function () {
        });
        loadingScene.addEntity({
            percentLoaded: 0,
            textLocation: new sugarLab.Vec2(400, 300),
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

        var menuScene = new sugarLab.Scene('menu', [], function () {
            var modal = $('.modal');

            modal.append(domjs.build(templates.menu));

            app.currentScene.addEntity(new Spartan(true));
            app.currentScene.addEntity(new Spawner());
            $('.menu .button').on('click', function () {
                modal.empty();
                modal.off();
                app.transitionScene($(this).attr('id'));
            });

            app.currentScene.addEntity(new Background());
        });

        var settingsScene = new sugarLab.Scene('settings', [], function () {
            var modal = $('.modal');

            modal.append(domjs.build(templates.settings));

            $('.sound-toggle').text(app.assetCollection.assets.settings.sound.toString().toUpperCase());
            $('.difficulty-toggle').text(app.assetCollection.assets.settings.difficulty);

            $('.menu .button').on('click', function () {
                var idClicked = $(this).attr('id');

                if (idClicked === 'menu') {
                    modal.empty();
                    modal.off();
                    app.transitionScene(idClicked);
                } else {
                    if (idClicked === 'sound') {
                        app.assetCollection.assets.settings.sound = !app.assetCollection.assets.settings.sound;
                        $('.sound-toggle').text(app.assetCollection.assets.settings.sound.toString().toUpperCase());
                    } else {
                        var difficultyToggle = $('.difficulty-toggle');

                        if (difficultyToggle.text() === 'EASY') {
                            app.assetCollection.assets.settings.difficulty = 'MEDIUM';
                            difficultyToggle.text('MEDIUM');
                        } else if (difficultyToggle.text() === 'MEDIUM') {
                            app.assetCollection.assets.settings.difficulty = 'HARD';
                            difficultyToggle.text('HARD');
                        } else {
                            app.assetCollection.assets.settings.difficulty = 'EASY';
                            difficultyToggle.text('EASY');
                        }
                    }
                }
            });

            app.currentScene.addEntity({
                update: function () {},
                draw: function (sctx) { sctx.clearRect(0, 0, 800, 600); }
            });
        });

        var aboutScene = new sugarLab.Scene('about', [], function () {
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

        var gameScene = new sugarLab.Scene('game', [], function () {
            app.currentScene.addEntity(new Spartan(false));
            app.currentScene.addEntity(new Spawner());

            app.currentScene.addEntity(new Background());
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

function Spartan(isAI) {
    var me = this,
        animations;

    me.zIndex = 2;
    me.health = 5;
    me.spears = 3;
    me.kills = 0;
    me.tag = 'spartan';
    me.moveSpeed = new sugarLab.Vec2(60, 0);
    me.range = 80;
    me.facing = 1;
    me.timeToAttack = ATTACK_INTERVAL;
    me.state = 'idle';

    me.images = [
        app.assetCollection.getImage('spartan-walk-left.png'),
        app.assetCollection.getImage('spartan-walk-right.png'),
        app.assetCollection.getImage('spartan-block-left.png'),
        app.assetCollection.getImage('spartan-block-right.png'),
        app.assetCollection.getImage('spartan-idle.png'),
        app.assetCollection.getImage('spartan-attack-left.png'),
        app.assetCollection.getImage('spartan-attack-right.png')
    ];

    animations = {
        "walk-left": new sugarLab.Animation({
            name: 'walk-left',
            playTime: 7,
            sourceImage: me.images[0],
            frameSize: new sugarLab.Vec2(156, 160),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(2028, 800)),
            frameCount: 63
        }),
        "walk-right": new sugarLab.Animation({
            name: 'walk-right',
            playTime: 7,
            sourceImage: me.images[1],
            frameSize: new sugarLab.Vec2(112, 150),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1792, 600)),
            frameCount: 63
        }),
        "block-left": new sugarLab.Animation({
            name: 'block-left',
            playTime: 10,
            sourceImage: me.images[2],
            frameSize: new sugarLab.Vec2(95, 140),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1995, 420)),
            frameCount: 63
        }),
        "block-right": new sugarLab.Animation({
            name: 'block-right',
            playTime: 6,
            sourceImage: me.images[3],
            frameSize: new sugarLab.Vec2(112, 143),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1008, 1001)),
            frameCount: 63
        }),
        idle: new sugarLab.Animation({
            name: 'idle',
            playTime: 9,
            sourceImage: me.images[4],
            frameSize: new sugarLab.Vec2(96, 142),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(2016, 426)),
            frameCount: 63
        }),
        "attack-left": new sugarLab.Animation({
            name: 'attack-left',
            playTime: 8,
            sourceImage: me.images[5],
            frameSize: new sugarLab.Vec2(140, 145),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1260, 1015)),
            frameCount: 63
        }),
        "attack-right": new sugarLab.Animation({
            name: 'attack-right',
            playTime: 8,
            sourceImage: me.images[6],
            frameSize: new sugarLab.Vec2(124, 150),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1984, 600)),
            frameCount: 63
        })
    };

    me.animator = new sugarLab.Animator(app, animations);

    me.rect = new sugarLab.Rect(new sugarLab.Vec2(0, 300), new sugarLab.Vec2(100, 150));

    me.update = isAI ? AI.spartan.bind(me) : function () {
        var me = this,
            keys = app.assetCollection.assets.keys,
            direction;

        if (me.health > 0) {
            me.timeToAttack -= app.deltaTime;

            if (me.state === 'attack' && me.timeToAttack > 0) {

            } else {
                if (me.state === 'attack') {
                    me.attack()
                }

                if (app.isKeyDown(keys.left)) {
                    me.state = 'walk';
                    me.facing = -1;
                } else if (app.isKeyDown(keys.right)) {
                    me.state = 'walk';
                    me.facing = 1;
                } else if (app.isKeyDown(keys.block)) {
                    me.state = 'block';
                } else if (app.isKeyDown(keys.attack)) {
                    me.state = 'attack';
                } else {
                    me.state = 'idle';
                }
            }

            if (me.state === 'walk') {
                me.rect.translate(me.moveSpeed.getScaled(me.facing).getScaled(app.deltaTime));
            }

            direction = me.facing > 0 ? '-right' : '-left';
            direction = me.state === 'idle' ? '' : direction;

            me.animator.playAnimation(me.state + direction);
            me.animator.update();

            app.camera.offset = new sugarLab.Vec2(me.rect.origin.getScaled(-1).getTranslated(CAMERA_OFFSET).x, 0);
        } else {
            app.transitionScene('menu');
        }
    };

    me.draw = function (sctx) {
        var curAnimation = me.animator.currentAnimation,
            curFrame = me.animator.getCurrentFrame();

        sugarLab.drawTextCentered(me.kills, new sugarLab.Vec2(710, 50), 'red', '36px Spatter', sctx);
        sugarLab.drawTextCentered(me.kills, new sugarLab.Vec2(700, 50), 'white', '32px Arial Bold', sctx);

        app.camera.drawImage({
            image: curAnimation.sourceImage,
            location: me.rect.location,
            drawSource: curFrame,
            drawOrigin: new sugarLab.Vec2(0, 0)
        });

        for (var i = 0; i < me.health; i++) {
            sugarLab.drawText('0', new sugarLab.Vec2(700 - (20 * i), 100), 'red', '36px Spatter', sctx);
        }

        sugarLab.drawTextCentered('Kills: ', new sugarLab.Vec2(650, 50), 'white', '32px Arial Bold', sctx);
        sugarLab.drawTextCentered('Health: ', new sugarLab.Vec2(550, 100), 'white', '32px Arial Bold', sctx);
    };

    me.attack = function () {
        var enemies = app.currentScene.getEntitiesByTag('persian'),
            attackBox = new sugarLab.Rect(me.rect.location.getTranslated(new sugarLab.Vec2(me.range * me.facing, 0)),
                new sugarLab.Vec2(me.range, me.rect.y));

        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].rect.intersects(attackBox)) {
                enemies[i].health -= 1;

                if (enemies[i].health <= 0) {
                    me.kills++;
                }
            }
        }

        me.timeToAttack = ATTACK_INTERVAL;
    };
}

function Persian(config) {
    var me = this,
        difficulty = app.assetCollection.assets.settings.difficulty,
        numDifficulty = 1,
        spartan = app.currentScene.getEntitiesByTag('spartan')[0],
        spawnEnd = 1,
        animations;

    if (Math.random() < 0.5) {
        spawnEnd *= -1;
    }

    me.zIndex = 1;
    me.tag = 'persian';
    me.facing = 1;
    me.range = config.range;
    me.enemyType = config.type;
    me.blocking = false;
    me.timeToAttack = ATTACK_INTERVAL;
    me.state = 'walk';

    me.images = [
        app.assetCollection.getImage(me.enemyType + '-walk-left.png'),
        app.assetCollection.getImage(me.enemyType + '-walk-right.png'),
        app.assetCollection.getImage(me.enemyType + '-attack-left.png'),
        app.assetCollection.getImage(me.enemyType + '-attack-right.png')
    ];

    animations = {
        "walk-left": new sugarLab.Animation({
            name: 'walk-left',
            playTime: 6,
            sourceImage: me.images[0],
            frameSize: new sugarLab.Vec2(116, 150),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1856, 600)),
            frameCount: 63
        }),
        "walk-right": new sugarLab.Animation({
            name: 'walk-right',
            playTime: 6,
            sourceImage: me.images[1],
            frameSize: new sugarLab.Vec2(108, 126),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1728, 504)),
            frameCount: 63
        }),
        "attack-left": new sugarLab.Animation({
            name: 'attack-left',
            playTime: 6,
            sourceImage: me.images[2],
            frameSize: new sugarLab.Vec2(148, 156),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1924, 780)),
            frameCount: 63
        }),
        "attack-right": new sugarLab.Animation({
            name: 'attack-right',
            playTime: 6,
            sourceImage: me.images[3],
            frameSize: new sugarLab.Vec2(150, 140),
            sourceRect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), new sugarLab.Vec2(1350, 980)),
            frameCount: 63
        })
    };

    me.animator = new sugarLab.Animator(app, animations);

    if (difficulty === 'MEDIUM') {
        numDifficulty = 2;
    } else if (difficulty === 'HARD') {
        numDifficulty = 3;
    }
    me.health = config.health * numDifficulty;

    me.moveSpeed = new sugarLab.Vec2(60, 0).scale(config.moveSpeed);
    me.rect = new sugarLab.Rect(spartan.rect.location.getTranslated(new sugarLab.Vec2(450 * spawnEnd, 0)),
        new sugarLab.Vec2(100, 150));
    me.update = AI.persian.bind(me);

    me.draw = function () {
        var curAnimation = me.animator.currentAnimation,
            curFrame = me.animator.getCurrentFrame();

        app.camera.drawImage({
            image: curAnimation.sourceImage,
            location: me.rect.location,
            drawSource: curFrame,
            drawOrigin: new sugarLab.Vec2(0, 0)
        });
    };

    me.attack = function () {
        var spartan = app.currentScene.getEntitiesByTag('spartan')[0];

        if (spartan.state === 'blocking') {
            if (spartan.facing === me.facing) {
                spartan.health -= 1;
            }
        } else {
            spartan.health -= 1;
        }

        me.timeToAttack = ATTACK_INTERVAL;
    };
}

function Background () {
    var me = this,
        backgroundSize = new sugarLab.Vec2(1600, 600),
        windowSize = new sugarLab.Vec2(800, 600),
        camera = app.camera,
        image = app.assetCollection.getImage('background.png');

    me.backgrounds = [
        {
            rect: new sugarLab.Rect(new sugarLab.Vec2(0, 0), backgroundSize.clone())
        },
        {
            rect: new sugarLab.Rect(new sugarLab.Vec2(-1600, 0), backgroundSize.clone())
        }
    ];

    me.update = function () {
        var windowRect = new sugarLab.Rect(camera.offset.getScaled(-1), windowSize),
            spartan = app.currentScene.getEntitiesByTag('spartan')[0],
            other;

        for (var i = 0; i < me.backgrounds.length; i++) {
            other = i === 0 ? 1 : 0;

            if (!me.backgrounds[i].rect.intersects(windowRect)) {
                if (spartan.rect.origin.x >= me.backgrounds[other].rect.origin.x) {
                    me.backgrounds[i].rect.setLocation(new sugarLab.Vec2(me.backgrounds[other].rect.location.x + backgroundSize.x, 0));
                } else{
                    me.backgrounds[i].rect.setLocation(new sugarLab.Vec2(me.backgrounds[other].rect.location.x - backgroundSize.x, 0));
                }
                break;
            }
        }
    };

    me.draw = function () {
        camera.drawImage({
            image: image,
            location: me.backgrounds[0].rect.location,
            drawOrigin: new sugarLab.Vec2(0, 0)
        });
        camera.drawImage({
            image: image,
            location: me.backgrounds[1].rect.location,
            drawOrigin: new sugarLab.Vec2(0, 0)
        });
    }
}

(function AI() {
    window.AI = {
        persian: function () {
            var me = this,
                spartan = app.currentScene.getEntitiesByTag('spartan')[0],
                direction = me.facing > 0 ? '-right' : '-left';

            me.facing = spartan.rect.origin.x >= me.rect.origin.x ? 1 : -1;
            me.timeToAttack -= app.deltaTime;

            if (me.health <= 0) {
                app.currentScene.removeEntity(me);
            } else {
                if (me.state === 'attack' && me.timeToAttack > 0) {

                } else {
                    if (me.state === 'attack') {
                        me.attack()
                    }

                    if (me.rect.origin.distance(spartan.rect.origin) < me.range) {
                        me.state = 'attack';
                    } else {
                        me.state = 'walk';
                        me.rect.translate(me.moveSpeed.getScaled(me.facing).getScaled(app.deltaTime));
                    }
                }

                me.animator.playAnimation(me.state + direction);
                me.animator.update();
            }
        },
        spartan: function () {
            var me = this,
                persians = app.currentScene.getEntitiesByTag('persian'),
                target = persians[0],
                direction;

            me.timeToAttack -= app.deltaTime;
            me.health = 5;

            if (me.state === 'attack' && me.timeToAttack > 0) {

            } else {
                if (me.state === 'attack') {
                    me.attack()
                }

                for (var i = 0; i < persians.length; i++) {
                    if (persians[i].rect.origin.distance(me.rect.origin) <= target.rect.origin.distance(me.rect.origin)) {
                        target = persians[i];
                    }
                }

                if (target) {
                    if (target.rect.origin.x >= me.rect.origin.x) {
                        me.facing = 1;
                    } else if (target.rect.origin.x <= me.rect.origin.x) {
                        me.facing = -1;
                    }

                    if (target.rect.origin.distance(me.rect.origin) <= me.range) {
                        me.state = 'attack';
                    } else {
                        me.state = 'walk';
                    }
                } else {
                    me.state = 'idle';
                }
            }

            if (me.state === 'walk') {
                me.rect.translate(me.moveSpeed.getScaled(me.facing).getScaled(app.deltaTime));
            }

            direction = me.facing > 0 ? '-right' : '-left';
            direction = me.state === 'idle' ? '' : direction;

            me.animator.playAnimation(me.state + direction);
            me.animator.update();

            app.camera.offset = new sugarLab.Vec2(me.rect.origin.getScaled(-1).getTranslated(CAMERA_OFFSET).x, 0);
        }
    };
})();

function Spawner() {
    var me = this,
        timer,
        timerWrapper;

    me.lastSpawn = SPAWN_INTERVAL * 5;
    me.spawnsLeft = WAVE_SIZE;

    $('.modal').append(domjs.build(templates.spawnTimer))
    timerWrapper = $('.timer-wrapper');
    timer = $('.dial');
    timer.knob({
        max: 10,
        width: 100,
        inputColor: '#771100',
        fgColor: '#CC2200',
        bgColor: '#552211'
    });

    me.update = function () {
        var numPersians = app.currentScene.getEntitiesByTag('persian').length,
            actualEnemyType = 'regular';

        if (numPersians === 0) {
            timer.val(me.lastSpawn.toFixed()).trigger('change');
            timerWrapper.show();
        } else {
            timerWrapper.hide();
        }

        me.lastSpawn -= app.deltaTime;

        if (me.spawnsLeft > 0) {
            if (me.lastSpawn <= 0) {
                timerWrapper.animate({
                    height: '0'
                });
                me.lastSpawn = SPAWN_INTERVAL;
                me.spawnsLeft--;

                /*
                if (app.currentScene.time >= ARMOR_THRESHOLD) {
                    if (Math.random() >= ARMOR_CHANCE) {
                        actualEnemyType = 'armored';
                    }
                }
                if (app.currentScene.time >= ARCHER_THRESHOLD) {
                    if (Math.random() >= ARCHER_CHANCE) {
                        actualEnemyType = 'archer';
                    }
                }*/

                app.currentScene.addEntity(new Persian(app.assetCollection.assets.persians[actualEnemyType]));
            }
        } else {
            if (numPersians === 0) {
                me.lastSpawn = sugarLab.Tween.lerp(SPAWN_INTERVAL * 5, 5, app.currentScene.time / 180000);
                timer.trigger('configure',{
                    max: me.lastSpawn.toFixed()
                });
                me.spawnsLeft = WAVE_SIZE;
            }
        }
    };

    me.draw = function () {};
}