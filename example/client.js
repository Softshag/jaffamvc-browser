JaffaMVC.Debug = true;
//Backbone.$ = JaffaMVC.$ = $;
JaffaMVC.$(function () {

  var app = new JaffaMVC.Application({
    regions: {
      header: "#header",
      content: "#content"
    }
  });

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
        this.ui.button.innerHTML = "TEST"
      }
    },
    onRender: function () {
      console.log(this)
    }
  });

  app.regions.header.show(view);


  var collection = new JaffaMVC.Collection([{"title":"Title 1"},{"title": "Title 2"}, {"title": "Title 3"}]);





  var collectionView = new JaffaMVC.CollectionView({
    collection: collection,
    childView: JaffaMVC.View.extend({
      triggers: {
        'click': "click"
      },
      template: function (data) {
        return "<p>" + data.title + "</p>"
      },
      onShow: function () {
        console.log('on show', this.model.get('title'))
      }
     })
  });

  collectionView.on('childview:click', function () {
    console.log('child view was selected');
    collection.reset([{"title":"Title 1"},{"title": "Title 2"}, {"title": "Title 3"}])
  });


  app.regions.content.show(collectionView);
  /*
  setTimeout(function () {
    app.regions.content.show(collectionView);
  }, 1000)

  setTimeout(function () {
    collection.add({title:"Title 4"})
  }, 1200)*/


});
