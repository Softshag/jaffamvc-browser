
JaffaMVC.$(function () {

  var app = new JaffaMVC.Application({
    regions: {
      header: "#header",
      content: "#content"
    }
  });

  app.addInitializer(function (options, done) {
    setTimeout(function () {
      console.log('init');
      done();
    }, 1000)

  });

  app.module('test', {
    startWithParent: true,
    initialize: function () {
      console.log('module!');
      this.addInitializer(this.init);
    },
    init: function () {
      console.log('module initializer');
    }
  })

  app.addInitializer(function () {
    console.log('init 2')
  })

  app.start();

  var view = new JaffaMVC.View({
    template: function (data) {
        return "<p>"+data.title+"<button class=\"button\">ok</button></p>"
    },
    ui: {
      button: '.button'
    },
    model: new JaffaMVC.Model({
      title: 'Test title'
    }),
    events: {
      "click @ui.button": function () {
        console.log(this.ui.button)
        this.ui.button.innerHTML = "TEST"
      }
    },
    onRender: function () {
      console.log(this)
    }
  });

  app.regions.header.show(view);


  var collection = new JaffaMVC.Collection([
    {"title":"Title 1"},{"title": "Title 2"}, {"title": "Title 3"}
  ]);


  var collectionView = new JaffaMVC.CollectionView({
    collection: collection,
    childView: JaffaMVC.View.extend({
      triggers: {
        'click': "click"
      },
      template: function (data) {
        return "<p>" + data.title + "</p>"
      }
    })
  });

  collectionView.on('childview:click', function () {
    console.log('child view was selected');
  });


  app.regions.content.show(collectionView);

});
