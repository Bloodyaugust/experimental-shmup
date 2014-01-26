var CAMERA_OFFSET = new sugarLab.Vec2(0, 0);

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
        });

        var settingsScene = new sugarLab.Scene('settings', [], function () {
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